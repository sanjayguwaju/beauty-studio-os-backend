import { Schema, model, Document, Types } from "mongoose";

export interface ICitizen extends Document {
  municipalityId: Types.ObjectId;
  wardId: Types.ObjectId;
  householdId?: Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  firstNameNp?: string;
  lastNameNp?: string;
  gender?: "male" | "female" | "other";
  dateOfBirthAd?: Date;
  dateOfBirthBs?: string;
  citizenshipNumber?: string;
  citizenshipIssuedDistrict?: string;
  nationalIdNumber?: string;
  phone?: string;
  email?: string;
  permanentAddress?: string;
  occupation?: string;
  photoUrl?: string;
  isVerified: boolean;
  status: "pending" | "approved" | "rejected";
  isDeleted: boolean;
}

const citizenSchema = new Schema<ICitizen>(
  {
    municipalityId: { type: Schema.Types.ObjectId, ref: "Municipality", required: true },
    wardId: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    householdId: { type: Schema.Types.ObjectId },
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    firstNameNp: String,
    lastNameNp: String,
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirthAd: Date,
    dateOfBirthBs: String,
    citizenshipNumber: { type: String, sparse: true },
    citizenshipIssuedDistrict: String,
    nationalIdNumber: String,
    phone: String,
    email: String,
    permanentAddress: String,
    occupation: String,
    photoUrl: String,
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

citizenSchema.index({ municipalityId: 1, isDeleted: 1 });
citizenSchema.index({ citizenshipNumber: 1 }, { sparse: true });
citizenSchema.index({ firstName: "text", lastName: "text" });

export const Citizen = model<ICitizen>("Citizen", citizenSchema);
