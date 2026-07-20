import { Schema, model, Document, Types } from "mongoose";

export interface ICommission extends Document {
  staffPersonId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  amount: number;
  basis: "solo_service";
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>(
  {
    staffPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    amount: { type: Number, required: true },
    basis: { type: String, enum: ["solo_service"], default: "solo_service" },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commissionSchema.index({ staffPersonId: 1, paid: 1 });
commissionSchema.index({ appointmentId: 1 });

export const Commission = model<ICommission>("Commission", commissionSchema);
