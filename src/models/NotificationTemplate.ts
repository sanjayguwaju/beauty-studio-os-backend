import mongoose, { Schema, Document } from "mongoose";

export interface INotificationTemplate extends Document {
  tenantId: string;
  channel: "sms" | "whatsapp" | "email";
  triggerType: "appointment_reminder" | "class_alert" | "certificate_ready" | "low_stock" | "promo";
  subject?: string;
  bodyTemplate: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    tenantId: { type: String, required: true },
    channel: { type: String, enum: ["sms", "whatsapp", "email"], required: true },
    triggerType: { 
      type: String, 
      enum: ["appointment_reminder", "class_alert", "certificate_ready", "low_stock", "promo"], 
      required: true 
    },
    subject: { type: String }, // For emails
    bodyTemplate: { type: String, required: true },
  },
  { timestamps: true }
);

export const NotificationTemplate = mongoose.model<INotificationTemplate>("NotificationTemplate", NotificationTemplateSchema);
