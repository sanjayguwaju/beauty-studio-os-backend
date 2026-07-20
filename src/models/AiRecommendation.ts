import mongoose, { Schema, Document } from "mongoose";

export interface IAiRecommendation extends Document {
  tenantId: string;
  clientPersonId: mongoose.Types.ObjectId;
  type: "rebooking" | "complementary_service";
  recommendedServiceId?: mongoose.Types.ObjectId;
  reasoning: string;
  generatedAt: Date;
  dismissed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AiRecommendationSchema = new Schema<IAiRecommendation>(
  {
    tenantId: { type: String, required: true },
    clientPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    type: { type: String, enum: ["rebooking", "complementary_service"], required: true },
    recommendedServiceId: { type: Schema.Types.ObjectId, ref: "ServiceCatalog" },
    reasoning: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    dismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AiRecommendation = mongoose.model<IAiRecommendation>("AiRecommendation", AiRecommendationSchema);
