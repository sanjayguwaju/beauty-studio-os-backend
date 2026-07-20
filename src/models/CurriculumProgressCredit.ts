import { Schema, model, Document, Types } from "mongoose";

export interface ICurriculumProgressCredit extends Document {
  studentPersonId: Types.ObjectId;
  curriculumItemId: Types.ObjectId;
  sessionLogId: Types.ObjectId;
  creditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const curriculumProgressCreditSchema = new Schema<ICurriculumProgressCredit>(
  {
    studentPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    curriculumItemId: { type: Schema.Types.ObjectId, ref: "CurriculumItem", required: true },
    sessionLogId: { type: Schema.Types.ObjectId, ref: "SessionLog", required: true },
    creditedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

curriculumProgressCreditSchema.index({ studentPersonId: 1, curriculumItemId: 1 });

export const CurriculumProgressCredit = model<ICurriculumProgressCredit>(
  "CurriculumProgressCredit",
  curriculumProgressCreditSchema
);
