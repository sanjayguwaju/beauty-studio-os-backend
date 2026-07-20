import mongoose, { Schema, Document } from "mongoose";

export interface IWebhookConfig extends Document {
  tenantId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookConfigSchema = new Schema<IWebhookConfig>(
  {
    tenantId: { type: String, required: true },
    url: { type: String, required: true },
    secret: { type: String, required: true },
    events: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WebhookConfig = mongoose.model<IWebhookConfig>("WebhookConfig", WebhookConfigSchema);
