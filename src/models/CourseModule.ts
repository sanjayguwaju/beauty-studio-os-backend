import { Schema, model, Document, Types } from "mongoose";

export interface ICourseModule extends Document {
  courseId: Types.ObjectId;
  name: string;
  sequenceOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseModuleSchema = new Schema<ICourseModule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    name: { type: String, required: true },
    sequenceOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

courseModuleSchema.index({ courseId: 1, sequenceOrder: 1 });

export const CourseModule = model<ICourseModule>("CourseModule", courseModuleSchema);
