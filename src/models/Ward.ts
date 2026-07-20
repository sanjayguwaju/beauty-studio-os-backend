import { Schema, model, Document, Types } from "mongoose";

export interface IWard extends Document {
  municipalityId: Types.ObjectId;
  wardNumber: number;
  nameNp?: string;
  officeAddress?: string;
  contactPhone?: string;
  population?: number;
  isActive: boolean;
}

const wardSchema = new Schema<IWard>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardNumber: { type: Number, required: true },
    nameNp: String,
    officeAddress: String,
    contactPhone: String,
    population: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

wardSchema.index({ municipalityId: 1, wardNumber: 1 }, { unique: true });

export const Ward = model<IWard>("Ward", wardSchema);
