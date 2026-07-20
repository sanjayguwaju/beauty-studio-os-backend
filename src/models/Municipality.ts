import { Schema, model, Document, Types } from "mongoose";

export interface IMunicipality extends Document {
  name: string;
  nameNp?: string;
  code: string;
  subdomain: string;
  district?: string;
  province?: string;
  type: "rural" | "urban" | "sub-metropolitan" | "metropolitan";
  totalWards: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  themeConfig?: {
    primaryColor: string;
  };
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const municipalitySchema = new Schema<IMunicipality>(
  {
    name: { type: String, required: true },
    nameNp: String,
    code: { type: String, required: true, unique: true, uppercase: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    district: String,
    province: String,
    type: { type: String, enum: ["rural","urban","sub-metropolitan","metropolitan"], default: "rural" },
    totalWards: { type: Number, default: 9 },
    contactEmail: String,
    contactPhone: String,
    address: String,
    logoUrl: String,
    themeConfig: {
      primaryColor: { type: String, default: "#1C2434" } // Default tailwind brand color (or any specific hex)
    },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true },
);

export const Municipality = model<IMunicipality>("Municipality", municipalitySchema);
