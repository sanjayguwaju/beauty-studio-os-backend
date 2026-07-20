import { Schema, model, Document, Types } from "mongoose";

export interface IServiceCatalog extends Document {
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId; // null = all branches
  category: "hair" | "facial" | "nails" | "spa";
  name: string;
  description?: string;
  durationMinutes: number;
  priceSolo: number;
  priceSupervised?: number;
  active: boolean;
  mappedCurriculumItemId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceCatalogSchema = new Schema<IServiceCatalog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    category: {
      type: String,
      enum: ["hair", "facial", "nails", "spa"],
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    durationMinutes: { type: Number, required: true, min: 5 },
    priceSolo: { type: Number, required: true, min: 0 },
    priceSupervised: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
    mappedCurriculumItemId: { type: Schema.Types.ObjectId, ref: "CurriculumItem" },
  },
  { timestamps: true }
);

serviceCatalogSchema.index({ tenantId: 1, branchId: 1, category: 1 });
serviceCatalogSchema.index({ tenantId: 1, name: 1 }); // For search

export const ServiceCatalog = model<IServiceCatalog>("ServiceCatalog", serviceCatalogSchema);
