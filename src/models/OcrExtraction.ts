import mongoose, { Schema, Document } from "mongoose";

export interface IOcrExtraction extends Document {
  tenantId: string;
  sourceDocumentUrl: string;
  extractedFields: {
    name?: string;
    dob?: string;
    idNumber?: string;
    [key: string]: any;
  };
  confidenceScore: number;
  reviewedByPersonId?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const OcrExtractionSchema = new Schema<IOcrExtraction>(
  {
    tenantId: { type: String, required: true },
    sourceDocumentUrl: { type: String, required: true },
    extractedFields: { type: Schema.Types.Mixed, default: {} },
    confidenceScore: { type: Number, required: true },
    reviewedByPersonId: { type: Schema.Types.ObjectId, ref: "Person" },
    reviewedAt: { type: Date },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const OcrExtraction = mongoose.model<IOcrExtraction>("OcrExtraction", OcrExtractionSchema);
