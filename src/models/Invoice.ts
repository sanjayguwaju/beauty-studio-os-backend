import { Schema, model, Document, Types } from "mongoose";

export interface ILineItem {
  description: string;
  amount: number;
}

export interface IInvoice extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  type: "service" | "course_fee";
  clientOrStudentPersonId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  enrollmentId?: Types.ObjectId;
  lineItems: ILineItem[];
  totalAmount: number;
  status: "unpaid" | "paid" | "partial";
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    type: { type: String, enum: ["service", "course_fee"], required: true },
    clientOrStudentPersonId: { type: Schema.Types.ObjectId, ref: "Person" },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment" },
    lineItems: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["unpaid", "paid", "partial"], default: "unpaid" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, type: 1 });
invoiceSchema.index({ clientOrStudentPersonId: 1 });

export const Invoice = model<IInvoice>("Invoice", invoiceSchema);
