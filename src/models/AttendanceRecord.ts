import { Schema, model, Document, Types } from "mongoose";

export interface IAttendanceRecord extends Document {
  batchId: Types.ObjectId;
  studentPersonId: Types.ObjectId;
  tenantId: Types.ObjectId;
  sessionDate: string; // YYYY-MM-DD for easier querying
  status: "present" | "absent" | "excused";
  recordedOffline: boolean;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    studentPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    sessionDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "excused"],
      required: true,
    },
    recordedOffline: { type: Boolean, default: false },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A student can only have one attendance record per batch per session (day)
attendanceRecordSchema.index({ batchId: 1, studentPersonId: 1, sessionDate: 1 }, { unique: true });

export const AttendanceRecord = model<IAttendanceRecord>("AttendanceRecord", attendanceRecordSchema);
