import { Schema, model, Document, Types } from "mongoose";

export interface ICertificationStatus extends Document {
  studentPersonId: Types.ObjectId;
  courseId: Types.ObjectId;
  requirementId: Types.ObjectId;
  currentValue: number;
  satisfied: boolean;
  satisfiedAt?: Date;
  overrideByPersonId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const certificationStatusSchema = new Schema<ICertificationStatus>(
  {
    studentPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    requirementId: { type: Schema.Types.ObjectId, ref: "CertificationRequirement", required: true },
    currentValue: { type: Number, default: 0 },
    satisfied: { type: Boolean, default: false },
    satisfiedAt: { type: Date },
    overrideByPersonId: { type: Schema.Types.ObjectId, ref: "Person" },
  },
  { timestamps: true }
);

certificationStatusSchema.index({ studentPersonId: 1, courseId: 1 });
certificationStatusSchema.index({ requirementId: 1 });

export const CertificationStatus = model<ICertificationStatus>(
  "CertificationStatus",
  certificationStatusSchema
);
