import { Schema, model, Document, Types } from "mongoose";

export interface IAdminDocument extends Document {
  tenantId: Types.ObjectId;
  title: string;
  titleNp?: string;
  documentUrl?: string; // R2/S3 URL via existing /upload module
  createdBy: Types.ObjectId;
  approvalId?: Types.ObjectId; // ref: ApprovableDocument
  isDeleted: boolean;
}

const adminDocumentSchema = new Schema<IAdminDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    title: { type: String, required: true },
    titleNp: String,
    documentUrl: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvalId: { type: Schema.Types.ObjectId, ref: "ApprovableDocument" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

adminDocumentSchema.index({ tenantId: 1, isDeleted: 1 });

export const AdminDocument = model<IAdminDocument>("AdminDocument", adminDocumentSchema);
