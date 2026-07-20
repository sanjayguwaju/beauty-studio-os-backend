import { Response } from "express";
import { AuthRequest } from "../../types";
import { Appointment } from "../../models/Appointment";
import { Invoice } from "../../models/Invoice";
import { Enrollment } from "../../models/Enrollment";
import { CertificationStatus } from "../../models/CertificationStatus";
import { Certificate } from "../../models/Certificate";
import { sendSuccess, sendError } from "../../utils/response";

// --- CLIENT PORTAL ---

export async function getClientAppointments(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const personId = req.user!.personId;

  if (!personId) return sendError(res, 401, "Person identity required");

  // Strictly filter by clientPersonId matching the authenticated user
  const appointments = await Appointment.find({ tenantId, clientPersonId: personId })
    .populate("serviceId", "name durationMinutes")
    .populate("practitionerPersonId", "fullName")
    .sort({ scheduledStart: -1 })
    .lean();

  return sendSuccess(res, appointments);
}

export async function bookClientAppointment(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const personId = req.user!.personId;
  const { serviceId, practitionerPersonId, scheduledStart, scheduledEnd } = req.body;

  if (!personId) return sendError(res, 401, "Person identity required");

  // Basic double booking check for practitioner
  const conflict = await Appointment.findOne({
    tenantId,
    practitionerPersonId,
    status: { $in: ["booked", "in_progress"] },
    $or: [
      { scheduledStart: { $lt: new Date(scheduledEnd), $gte: new Date(scheduledStart) } },
      { scheduledEnd: { $gt: new Date(scheduledStart), $lte: new Date(scheduledEnd) } },
    ]
  });

  if (conflict) {
    return sendError(res, 400, "The selected practitioner is not available for this time slot.");
  }

  const appointment = await Appointment.create({
    tenantId,
    clientPersonId: personId, // Hardcoded to current user
    serviceId,
    practitionerPersonId,
    practitionerRole: "stylist", // For self-service, assume stylist only (simplification)
    scheduledStart,
    scheduledEnd,
    status: "booked",
  });

  return sendSuccess(res, appointment, "Appointment booked successfully", 201);
}

export async function getClientInvoices(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const personId = req.user!.personId;

  if (!personId) return sendError(res, 401, "Person identity required");

  const invoices = await Invoice.find({ tenantId, clientOrStudentPersonId: personId, type: "service" })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, invoices);
}


// --- STUDENT PORTAL ---

export async function getStudentSchedule(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const personId = req.user!.personId;

  if (!personId) return sendError(res, 401, "Person identity required");

  // Get all active enrollments for this student
  const enrollments = await Enrollment.find({ tenantId, studentPersonId: personId, status: "active" })
    .populate({
      path: "batchId",
      select: "name startDate endDate schedule",
      populate: { path: "courseId", select: "title" }
    })
    .lean();

  return sendSuccess(res, enrollments);
}

export async function getStudentProgress(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const personId = req.user!.personId;

  if (!personId) return sendError(res, 401, "Person identity required");

  const progress = await CertificationStatus.find({ studentPersonId: personId })
    .populate("courseId", "title")
    .lean();

  return sendSuccess(res, progress);
}

export async function getStudentCertificates(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const personId = req.user!.personId;

  if (!personId) return sendError(res, 401, "Person identity required");

  const certificates = await Certificate.find({ studentPersonId: personId })
    .populate("courseId", "title")
    .lean();

  return sendSuccess(res, certificates);
}
