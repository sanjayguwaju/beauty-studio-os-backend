import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true }, // e.g. "ml", "bottle"
    currentStock: { type: Number, required: true, default: 0 },
    reorderThreshold: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, branchId: 1 });

export const Product = model<IProduct>("Product", productSchema);
