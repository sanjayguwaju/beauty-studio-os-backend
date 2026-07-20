import mongoose, { Schema, Document } from "mongoose";

export interface INotificationLog extends Document {
  tenantId: string;
  personId?: mongoose.Types.ObjectId; // Nullable for internal alerts (e.g. low-stock to managers generally)
  templateId?: mongoose.Types.ObjectId;
  channel: "sms" | "whatsapp" | "email";
  status: "queued" | "sent" | "failed";
  recipientContact: string; // The email or phone number sent to
  sentContent: string; // The actual rendered body that was sent
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    tenantId: { type: String, required: true },
    personId: { type: Schema.Types.ObjectId, ref: "Person" },
    templateId: { type: Schema.Types.ObjectId, ref: "NotificationTemplate" },
    channel: { type: String, enum: ["sms", "whatsapp", "email"], required: true },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    recipientContact: { type: String, required: true },
    sentContent: { type: String, required: true },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export const NotificationLog = mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema);
