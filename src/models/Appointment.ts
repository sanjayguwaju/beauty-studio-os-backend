import { Schema, model, Document, Types } from "mongoose";

export interface IAppointment extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  clientPersonId: Types.ObjectId;
  serviceId: Types.ObjectId;
  practitionerPersonId: Types.ObjectId;
  practitionerRole: "stylist" | "student";
  supervisingInstructorPersonId?: Types.ObjectId;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: "booked" | "in_progress" | "completed" | "cancelled" | "no_show";
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    clientPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "ServiceCatalog", required: true },
    practitionerPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    practitionerRole: {
      type: String,
      enum: ["stylist", "student"],
      required: true,
    },
    supervisingInstructorPersonId: { type: Schema.Types.ObjectId, ref: "Person" },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ["booked", "in_progress", "completed", "cancelled", "no_show"],
      default: "booked",
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ tenantId: 1, branchId: 1 });
appointmentSchema.index({ practitionerPersonId: 1, scheduledStart: 1 });
appointmentSchema.index({ clientPersonId: 1 });

export const Appointment = model<IAppointment>("Appointment", appointmentSchema);
