import { Schema, model, Document, Types } from "mongoose";

export interface IFeatureFlag extends Document {
  municipalityId?: Types.ObjectId;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystemFlag?: boolean;
  enabledWards: Types.ObjectId[];
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: false },
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: false },
    isSystemFlag: { type: Boolean, default: false },
    enabledWards: [{ type: Schema.Types.ObjectId, ref: "Ward" }],
  },
  { timestamps: true }
);

featureFlagSchema.index({ municipalityId: 1, key: 1 }, { unique: true });

export const FeatureFlag = model<IFeatureFlag>("FeatureFlag", featureFlagSchema);
