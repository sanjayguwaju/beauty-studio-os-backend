import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { ServiceRequest } from "../../models/ServiceRequest";
import { AuditLog } from "../../models/AuditLog";
import { generateTrackingNumber } from "../../utils/tracking";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const createSRValidation = [
  body("serviceType").notEmpty(),
  body("applicantName").notEmpty().trim(),
  body("applicantPhone").optional().isMobilePhone("any"),
];

export async function listServiceRequests(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const { status, branchId } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
    isDeleted: false,
  };
  if (status) filter.status = status;
  if (branchId) filter.branchId = branchId;
  if (req.user!.roles.includes("ward_officer") && req.user!.branchId) {
    filter.branchId = req.user!.branchId;
  }

  const [data, total] = await Promise.all([
    ServiceRequest.find(filter).populate("assignedTo", "name email").skip((page - 1) * pageSize).limit(pageSize).sort("-createdAt"),
    ServiceRequest.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createServiceRequest(req: AuthRequest, res: Response) {
  const trackingNumber = generateTrackingNumber("SR");
  const sr = await ServiceRequest.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    branchId: req.user!.branchId,
    trackingNumber,
  });
  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "service_requests", action: "CREATE", entityType: "ServiceRequest",
    entityId: sr._id, entityLabel: `SR: ${sr.serviceType} - ${sr.applicantName}`,
  });
  return sendSuccess(res, sr, "Service request submitted", 201);
}

export async function getServiceRequest(req: AuthRequest, res: Response) {
  const sr = await ServiceRequest.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  }).populate("assignedTo", "name email");
  if (!sr) return sendError(res, 404, "Service request not found");
  return sendSuccess(res, sr);
}

export async function trackByNumber(req: AuthRequest, res: Response) {
  const sr = await ServiceRequest.findOne({ trackingNumber: req.params.trackingNumber })
    .select("trackingNumber serviceType applicantName status createdAt updatedAt");
  if (!sr) return sendError(res, 404, "Tracking number not found");
  return sendSuccess(res, sr);
}

export async function updateStatus(req: AuthRequest, res: Response) {
  const { status, notes, rejectionReason } = req.body;
  const before = await ServiceRequest.findById(req.params.id);
  if (!before) return sendError(res, 404, "Service request not found");

  const sr = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    { $set: { status, notes, rejectionReason, ...(status === "completed" ? { completedAt: new Date() } : {}) } },
    { new: true },
  );
  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "service_requests", action: "STATUS_UPDATE", entityType: "ServiceRequest",
    entityId: sr!._id, before: { status: before.status }, after: { status },
  });
  return sendSuccess(res, sr, "Status updated");
}

export async function assignServiceRequest(req: AuthRequest, res: Response) {
  const sr = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    { assignedTo: req.body.userId, status: "under_review" },
    { new: true },
  );
  if (!sr) return sendError(res, 404, "Service request not found");
  return sendSuccess(res, sr, "Assigned");
}

export async function updateServiceRequest(req: AuthRequest, res: Response) {
  const sr = await ServiceRequest.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { $set: req.body }, { new: true }
  );
  if (!sr) return sendError(res, 404, "Service request not found");
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "service_requests", action: "UPDATE", entityType: "ServiceRequest",
    entityId: sr._id, entityLabel: sr.trackingNumber || "unknown",
  });
  return sendSuccess(res, sr, "Service request updated");
}

export async function deleteServiceRequest(req: AuthRequest, res: Response) {
  const sr = await ServiceRequest.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { isDeleted: true }, { new: true }
  );
  if (!sr) return sendError(res, 404, "Service request not found");
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "service_requests", action: "DELETE", entityType: "ServiceRequest",
    entityId: sr._id, entityLabel: sr.trackingNumber || "unknown",
  });
  return sendSuccess(res, null, "Service request deleted");
}
