import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  municipalityId: mongoose.Types.ObjectId;
  planName: string;
  status: "active" | "past_due" | "canceled" | "trial";
  startDate: Date;
  endDate: Date;
  price: number;
}

const SubscriptionSchema: Schema = new Schema(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    planName: { type: String, required: true },
    status: { type: String, enum: ["active", "past_due", "canceled", "trial"], default: "trial" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
