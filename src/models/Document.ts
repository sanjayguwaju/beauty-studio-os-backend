import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IDocument extends MongooseDocument {
  documentType: string;
  templateName: string;
  data: Record<string, any>;
  issuedBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  verificationHash: string;
  issueDate: Date;
  status: "valid" | "revoked";
  qrCodeUrl?: string;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentType: { type: String, required: true },
    templateName: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    verificationHash: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["valid", "revoked"], default: "valid" },
    qrCodeUrl: { type: String },
  },
  { timestamps: true }
);

export const AppDocument = mongoose.model<IDocument>("Document", DocumentSchema);
