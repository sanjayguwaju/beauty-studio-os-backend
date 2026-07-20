import { Schema, model, Document, Types } from "mongoose";

export interface IClientProfile extends Document {
  personId: Types.ObjectId;
  tenantId: Types.ObjectId;
  preferences?: string[];
  allergyNotes?: string;
  patchTestOnFile: boolean;
  patchTestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clientProfileSchema = new Schema<IClientProfile>(
  {
    personId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    preferences: [{ type: String }],
    allergyNotes: { type: String },
    patchTestOnFile: { type: Boolean, default: false },
    patchTestDate: { type: Date },
  },
  { timestamps: true }
);

clientProfileSchema.index({ tenantId: 1, personId: 1 }, { unique: true });

export const ClientProfile = model<IClientProfile>("ClientProfile", clientProfileSchema);
