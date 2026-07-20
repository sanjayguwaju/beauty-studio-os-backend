import { Schema, model, Document, Types } from "mongoose";

export interface IRoleAssignment extends Document {
  personId: Types.ObjectId;
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  role: "owner" | "branch_manager" | "stylist" | "instructor" | "student" | "receptionist" | "client";
  status: "active" | "inactive";
  startedAt: Date;
  endedAt?: Date;
}

const roleAssignmentSchema = new Schema<IRoleAssignment>(
  {
    personId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    role: { 
      type: String, 
      enum: ["owner", "branch_manager", "stylist", "instructor", "student", "receptionist", "client"],
      required: true 
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

roleAssignmentSchema.index({ personId: 1, tenantId: 1, role: 1 });
roleAssignmentSchema.index({ tenantId: 1, branchId: 1 });

export const RoleAssignment = model<IRoleAssignment>("RoleAssignment", roleAssignmentSchema);
