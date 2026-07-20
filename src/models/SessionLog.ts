import { Schema, model, Document, Types } from "mongoose";

interface IProductUsed {
  productName: string;
  quantity: number;
}

export interface ISessionLog extends Document {
  appointmentId: Types.ObjectId;
  beforePhotoUrl?: string; // S3/R2 URL
  afterPhotoUrl?: string; // S3/R2 URL
  productsUsed?: IProductUsed[];
  outcomeNotes?: string;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionLogSchema = new Schema<ISessionLog>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    beforePhotoUrl: { type: String },
    afterPhotoUrl: { type: String },
    productsUsed: [
      {
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    outcomeNotes: { type: String },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SessionLog = model<ISessionLog>("SessionLog", sessionLogSchema);
