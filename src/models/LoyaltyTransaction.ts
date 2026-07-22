import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILoyaltyTransaction extends Document {
  tenantId: Types.ObjectId;
  personId: Types.ObjectId;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  relatedInvoiceId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
    type: { type: String, enum: ['earn', 'redeem'], required: true },
    points: { type: Number, required: true }, // positive number
    description: { type: String, required: true },
    relatedInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' }
  },
  { timestamps: true }
);

export const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', loyaltyTransactionSchema);
