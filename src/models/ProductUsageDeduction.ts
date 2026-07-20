import { Schema, model, Document, Types } from "mongoose";

export interface IProductUsageDeduction extends Document {
  sessionLogId: Types.ObjectId;
  productId: Types.ObjectId;
  quantityUsed: number;
  deductedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productUsageDeductionSchema = new Schema<IProductUsageDeduction>(
  {
    sessionLogId: { type: Schema.Types.ObjectId, ref: "SessionLog", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantityUsed: { type: Number, required: true },
    deductedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

productUsageDeductionSchema.index({ sessionLogId: 1 });
productUsageDeductionSchema.index({ productId: 1 });

export const ProductUsageDeduction = model<IProductUsageDeduction>(
  "ProductUsageDeduction",
  productUsageDeductionSchema
);
