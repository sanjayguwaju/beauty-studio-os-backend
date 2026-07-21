import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  tenantId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId; // Optional: Link to a specific client if known
  platform: 'whatsapp' | 'instagram' | 'facebook';
  platformIdentifier: string; // Phone number or IG/FB User ID
  status: 'open' | 'closed' | 'snoozed';
  botStatus: 'active' | 'paused';
  lastMessageAt: Date;
  lastMessagePreview?: string;
  assignedTo?: mongoose.Types.ObjectId; // Optional: Staff member handling the chat
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Municipality', required: true }, // Using legacy name for tenant for now
    clientId: { type: Schema.Types.ObjectId, ref: 'Citizen' }, // Using legacy name for client
    platform: { type: String, enum: ['whatsapp', 'instagram', 'facebook'], required: true },
    platformIdentifier: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed', 'snoozed'], default: 'open' },
    botStatus: { type: String, enum: ['active', 'paused'], default: 'active' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for fast querying
ConversationSchema.index({ tenantId: 1, status: 1 });
ConversationSchema.index({ platformIdentifier: 1 });
ConversationSchema.index({ tenantId: 1, clientId: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
