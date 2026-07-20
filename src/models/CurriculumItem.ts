import { Schema, model, Document, Types } from "mongoose";

export interface ICurriculumItem extends Document {
  moduleId: Types.ObjectId;
  name: string;
  description?: string;
  requiresSupervisedCount?: number; // Nullable for Phase 2
  createdAt: Date;
  updatedAt: Date;
}

const curriculumItemSchema = new Schema<ICurriculumItem>(
  {
    moduleId: { type: Schema.Types.ObjectId, ref: "CourseModule", required: true },
    name: { type: String, required: true },
    description: { type: String },
    requiresSupervisedCount: { type: Number },
  },
  { timestamps: true }
);

curriculumItemSchema.index({ moduleId: 1 });

export const CurriculumItem = model<ICurriculumItem>("CurriculumItem", curriculumItemSchema);
