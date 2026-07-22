import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPerson extends Document {
  tenantId?: Types.ObjectId; // Default/primary tenant
  fullName: string;
  phone?: string;
  email?: string;
  authProvider: "auth0" | "otp";
  password?: string; // Optional if using auth0 or OTP only
  image?: string;
  isActive: boolean;
  loyaltyPoints: number;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const personSchema = new Schema<IPerson>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    fullName: { type: String, required: true },
    phone: { type: String },
    email: { type: String, lowercase: true },
    authProvider: { type: String, enum: ["auth0", "otp"], default: "auth0" },
    password: { type: String, select: false },
    image: String,
    isActive: { type: Boolean, default: true },
    loyaltyPoints: { type: Number, default: 0 },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

// Allow either email or phone to be indexed/unique depending on auth provider
personSchema.index({ email: 1 }, { unique: true, sparse: true });
personSchema.index({ phone: 1 }, { unique: true, sparse: true });

personSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

personSchema.methods.comparePassword = function (candidate: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

export const Person = model<IPerson>("Person", personSchema);
