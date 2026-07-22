import { Schema, model, Document, Types } from "mongoose";

export interface ILedgerEntry extends Document {
  tenantId: Types.ObjectId;
  type: "income" | "expense";
  amountNpr: number;
  branchId?: Types.ObjectId;
  /** Which department/module generated this entry — e.g. "disaster_management", "agriculture" */
  sourceModule?: string;
  /** Polymorphic ref to the source record (ReliefApplication, Distribution, etc.) */
  sourceRecordId?: Types.ObjectId;
  description: string;
  dateBs: string;
}

const ledgerEntrySchema = new Schema<ILedgerEntry>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amountNpr: { type: Number, required: true, min: 0 },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    sourceModule: String,
    sourceRecordId: Schema.Types.ObjectId,
    description: { type: String, required: true },
    dateBs: { type: String, required: true },
  },
  {
    timestamps: true,
    // Ledger is append-only — immutable like AuditLog, no updates or deletes
  },
);

ledgerEntrySchema.index({ tenantId: 1, type: 1 });
ledgerEntrySchema.index({ tenantId: 1, dateBs: 1 });
ledgerEntrySchema.index({ sourceModule: 1, sourceRecordId: 1 });

export const LedgerEntry = model<ILedgerEntry>("LedgerEntry", ledgerEntrySchema);
