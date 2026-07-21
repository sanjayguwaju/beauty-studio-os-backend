import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  targetAudience: 'all_clients' | 'inactive_clients' | 'academy_students';
  messageTemplate: string;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  sentCount: number;
  totalTarget: number;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  targetAudience: { 
    type: String, 
    enum: ['all_clients', 'inactive_clients', 'academy_students'],
    required: true 
  },
  messageTemplate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'sending', 'completed', 'failed'], 
    default: 'draft' 
  },
  sentCount: { type: Number, default: 0 },
  totalTarget: { type: Number, default: 0 },
}, { timestamps: true });

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
