import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: "starter" | "professional" | "enterprise";
  priceMonthly: number;
  includedFeatures: string[];
  maxBranches: number;
  maxStaff: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, enum: ["starter", "professional", "enterprise"], required: true, unique: true },
    priceMonthly: { type: Number, required: true },
    includedFeatures: [{ type: String }],
    maxBranches: { type: Number, required: true },
    maxStaff: { type: Number, required: true },
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
