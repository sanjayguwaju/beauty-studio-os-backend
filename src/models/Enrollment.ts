import { Schema, model, Document, Types } from "mongoose";

export interface IEnrollment extends Document {
  batchId: Types.ObjectId;
  studentPersonId: Types.ObjectId;
  tenantId: Types.ObjectId;
  status: "active" | "completed" | "dropped";
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    studentPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

enrollmentSchema.index({ batchId: 1, studentPersonId: 1 }, { unique: true });
enrollmentSchema.index({ tenantId: 1, studentPersonId: 1 });

export const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);
