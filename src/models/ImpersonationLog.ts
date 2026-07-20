import mongoose, { Schema, Document } from "mongoose";

export interface IImpersonationLog extends Document {
  supportPersonId: mongoose.Types.ObjectId;
  tenantId: string;
  reason: string;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
}

const ImpersonationLogSchema = new Schema<IImpersonationLog>(
  {
    supportPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    tenantId: { type: String, required: true },
    reason: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ImpersonationLog = mongoose.model<IImpersonationLog>("ImpersonationLog", ImpersonationLogSchema);
