import { Schema, model, Document, Types } from "mongoose";

export interface IServiceRequest extends Document {
  municipalityId: Types.ObjectId;
  wardId?: Types.ObjectId;
  trackingNumber: string;
  serviceType: string;
  citizenId?: Types.ObjectId;
  applicantName: string;
  applicantPhone?: string;
  applicantEmail?: string;
  formData?: Record<string, unknown>;
  status: "submitted" | "under_review" | "pending_documents" | "approved" | "rejected" | "completed";
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo?: Types.ObjectId;
  dueAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  outputDocumentUrl?: string;
  isDeleted: boolean;
}

const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward" },
    trackingNumber: { type: String, required: true, unique: true },
    serviceType: { type: String, required: true },
    citizenId: { type: Schema.Types.ObjectId, ref: "Citizen" },
    applicantName: { type: String, required: true },
    applicantPhone: String,
    applicantEmail: String,
    formData: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["submitted","under_review","pending_documents","approved","rejected","completed"],
      default: "submitted",
    },
    priority: { type: String, enum: ["low","normal","high","urgent"], default: "normal" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    dueAt: Date,
    completedAt: Date,
    rejectionReason: String,
    notes: String,
    outputDocumentUrl: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

serviceRequestSchema.index({ municipalityId: 1, status: 1 });
serviceRequestSchema.index({ trackingNumber: 1 });

export const ServiceRequest = model<IServiceRequest>("ServiceRequest", serviceRequestSchema);
