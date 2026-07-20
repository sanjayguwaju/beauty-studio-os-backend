import mongoose, { Schema, Document } from "mongoose";

export interface ITenantSubscription extends Document {
  tenantId: string;
  planId: mongoose.Types.ObjectId;
  status: "trial" | "active" | "past_due" | "cancelled";
  billingProvider: "stripe" | "esewa" | "khalti" | "none";
  currentPeriodEnd: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSubscriptionSchema = new Schema<ITenantSubscription>(
  {
    tenantId: { type: String, required: true, unique: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    status: { type: String, enum: ["trial", "active", "past_due", "cancelled"], default: "trial" },
    billingProvider: { type: String, enum: ["stripe", "esewa", "khalti", "none"], default: "none" },
    currentPeriodEnd: { type: Date, required: true },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
  },
  { timestamps: true }
);

export const TenantSubscription = mongoose.model<ITenantSubscription>("TenantSubscription", TenantSubscriptionSchema);
