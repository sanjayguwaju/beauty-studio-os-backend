import mongoose, { Schema, Document } from "mongoose";

export interface IWebhookEventLog extends Document {
  tenantId: string;
  webhookConfigId: mongoose.Types.ObjectId;
  event: string;
  payload: any;
  status: "success" | "failed";
  responseStatusCode?: number;
  errorMessage?: string;
  createdAt: Date;
}

const WebhookEventLogSchema = new Schema<IWebhookEventLog>(
  {
    tenantId: { type: String, required: true },
    webhookConfigId: { type: Schema.Types.ObjectId, ref: "WebhookConfig", required: true },
    event: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["success", "failed"], required: true },
    responseStatusCode: { type: Number },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const WebhookEventLog = mongoose.model<IWebhookEventLog>("WebhookEventLog", WebhookEventLogSchema);
