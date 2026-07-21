import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive' | 'template';
  mediaUrl?: string; // S3 or external URL for media
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  externalId?: string; // ID from WhatsApp/Meta to track status
  sentBy?: mongoose.Types.ObjectId; // User ID if sent by a staff member
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'audio', 'video', 'document', 'interactive', 'template'], default: 'text' },
    mediaUrl: { type: String },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed', 'received'], default: 'received' },
    externalId: { type: String },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ externalId: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
