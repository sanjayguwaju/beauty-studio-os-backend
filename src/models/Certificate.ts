import { Schema, model, Document, Types } from "mongoose";

export interface ICertificate extends Document {
  studentPersonId: Types.ObjectId;
  courseId: Types.ObjectId;
  issuedAt: Date;
  pdfUrl?: string; // S3/R2 URL
  certificateNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    studentPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String },
    certificateNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

certificateSchema.index({ studentPersonId: 1, courseId: 1 }, { unique: true });

export const Certificate = model<ICertificate>("Certificate", certificateSchema);
