import { Schema, model, Document, Types } from "mongoose";

export interface ICertificationRequirement extends Document {
  courseId: Types.ObjectId;
  ruleType: "supervised_count" | "solo_count" | "exam_pass" | "attendance_percentage";
  targetCurriculumItemId?: Types.ObjectId;
  thresholdValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const certificationRequirementSchema = new Schema<ICertificationRequirement>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    ruleType: {
      type: String,
      enum: ["supervised_count", "solo_count", "exam_pass", "attendance_percentage"],
      required: true,
    },
    targetCurriculumItemId: { type: Schema.Types.ObjectId, ref: "CurriculumItem" },
    thresholdValue: { type: Number, required: true },
  },
  { timestamps: true }
);

certificationRequirementSchema.index({ courseId: 1 });

export const CertificationRequirement = model<ICertificationRequirement>(
  "CertificationRequirement",
  certificationRequirementSchema
);
