import { Schema, model, Document, Types } from "mongoose";

export interface IBranch extends Document {
  tenantId: Types.ObjectId;
  name: string;
  nameNp?: string;
  address?: string;
  contactPhone?: string;
  isActive: boolean;
}

const branchSchema = new Schema<IBranch>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    nameNp: String,
    address: String,
    contactPhone: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

branchSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Branch = model<IBranch>("Branch", branchSchema);
