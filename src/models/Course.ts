import { Schema, model, Document, Types } from "mongoose";

export interface ICourse extends Document {
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  category: "hair" | "facial" | "nails" | "spa";
  durationWeeks: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ["hair", "facial", "nails", "spa"],
      required: true,
    },
    durationWeeks: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

courseSchema.index({ tenantId: 1, category: 1 });

export const Course = model<ICourse>("Course", courseSchema);
