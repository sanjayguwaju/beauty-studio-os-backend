import { Response } from "express";
import { AuthRequest } from "../../types";
import { Invoice } from "../../models/Invoice";
import { Commission } from "../../models/Commission";
import { sendSuccess, sendError } from "../../utils/response";

export async function listInvoices(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { type } = req.query; // "service" | "course_fee"
  
  const filter: any = { tenantId };
  if (type) filter.type = type;

  const invoices = await Invoice.find(filter)
    .populate("clientOrStudentPersonId", "fullName email phone")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, invoices);
}

export async function createCourseFeeInvoice(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const branchId = req.user!.branchId || req.body.branchId;

  const { studentPersonId, enrollmentId, lineItems, totalAmount } = req.body;

  const invoice = await Invoice.create({
    tenantId,
    branchId,
    type: "course_fee",
    clientOrStudentPersonId: studentPersonId,
    enrollmentId,
    lineItems,
    totalAmount
  });

  return sendSuccess(res, invoice, "Course fee invoice created", 201);
}

export async function listCommissions(req: AuthRequest, res: Response) {
  const commissions = await Commission.find()
    .populate("staffPersonId", "fullName email")
    .populate("appointmentId")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, commissions);
}

export async function markCommissionPaid(req: AuthRequest, res: Response) {
  const commission = await Commission.findByIdAndUpdate(
    req.params.id,
    { paid: true },
    { new: true }
  );

  if (!commission) return sendError(res, 404, "Commission not found");
  return sendSuccess(res, commission, "Commission marked as paid");
}
