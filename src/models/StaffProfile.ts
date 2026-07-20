import { Schema, model, Document, Types } from "mongoose";

export interface IStaffProfile extends Document {
  personId: Types.ObjectId;
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId; // null = works across all branches or generic
  specialties: ("hair" | "facial" | "nails" | "spa")[];
  workingHours: {
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    start: string; // "09:00"
    end: string;   // "17:00"
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const staffProfileSchema = new Schema<IStaffProfile>(
  {
    personId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    specialties: [
      {
        type: String,
        enum: ["hair", "facial", "nails", "spa"],
      },
    ],
    workingHours: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          required: true,
        },
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

staffProfileSchema.index({ tenantId: 1, branchId: 1 });
staffProfileSchema.index({ tenantId: 1, personId: 1 }, { unique: true });

export const StaffProfile = model<IStaffProfile>("StaffProfile", staffProfileSchema);
