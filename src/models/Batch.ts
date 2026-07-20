import { Schema, model, Document, Types } from "mongoose";

export interface IBatch extends Document {
  courseId: Types.ObjectId;
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId; // null = virtual or generic
  name: string;
  startDate: Date;
  endDate: Date;
  instructorPersonId?: Types.ObjectId; // Optional until assigned
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    instructorPersonId: { type: Schema.Types.ObjectId, ref: "Person" },
  },
  { timestamps: true }
);

batchSchema.index({ tenantId: 1, courseId: 1 });
batchSchema.index({ instructorPersonId: 1 });

export const Batch = model<IBatch>("Batch", batchSchema);
