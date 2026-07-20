import { Response } from "express";
import { AuthRequest } from "../../types";
import { Appointment } from "../../models/Appointment";
import { SessionLog } from "../../models/SessionLog";
import { CurriculumProgressCredit } from "../../models/CurriculumProgressCredit";
import { CurriculumItem } from "../../models/CurriculumItem";
import { CourseModule } from "../../models/CourseModule";
import { ServiceCatalog } from "../../models/ServiceCatalog";
import { Product } from "../../models/Product";
import { ProductUsageDeduction } from "../../models/ProductUsageDeduction";
import { Invoice } from "../../models/Invoice";
import { Commission } from "../../models/Commission";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";
import { getIO } from "../../config/socket";
import { recalculateStatus } from "../certifications/certifications.controller";
import { notificationQueue } from "../../queue/notification.queue";

// --- Appointments ---

export async function listAppointments(req: AuthRequest, res: Response) {
  const { start, end } = req.query; // ISO Date strings

  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const filter: Record<string, unknown> = { tenantId };

  // For calendar view, we often fetch a date range
  if (start && end) {
    filter.scheduledStart = { $gte: new Date(start as string), $lte: new Date(end as string) };
  }

  const data = await Appointment.find(filter)
    .populate("clientPersonId", "fullName phone email")
    .populate("serviceId", "name durationMinutes")
    .populate("practitionerPersonId", "fullName")
    .populate("supervisingInstructorPersonId", "fullName")
    .sort({ scheduledStart: 1 })
    .lean();

  return sendSuccess(res, data);
}

export async function createAppointment(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("create", "Appointment" as any)) { // Note: Adding Appointment to CASL next
    return sendError(res, 403, "Forbidden");
  }

  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const {
    branchId,
    clientPersonId,
    serviceId,
    practitionerPersonId,
    practitionerRole,
    supervisingInstructorPersonId,
    scheduledStart,
    scheduledEnd,
  } = req.body;

  // 1. Validation for student practitioner
  if (practitionerRole === "student" && !supervisingInstructorPersonId) {
    return sendError(res, 400, "Supervising instructor is required when the practitioner is a student.");
  }

  // 2. Double booking conflict detection for practitioner
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
    return sendError(res, 400, "The selected practitioner is already booked for this time slot.");
  }

  const appointment = await Appointment.create({
    tenantId,
    branchId: branchId || req.user!.branchId, // Fallback to user branch
    clientPersonId,
    serviceId,
    practitionerPersonId,
    practitionerRole,
    supervisingInstructorPersonId,
    scheduledStart,
    scheduledEnd,
    status: "booked",
  });

  // Emit socket event to the tenant room
  const io = getIO();
  io.to(`tenant:${tenantId}`).emit("appointment_created", appointment);

  // Phase 7: Enqueue appointment reminder 24 hours before
  const reminderTime = new Date(new Date(scheduledStart).getTime() - 24 * 60 * 60 * 1000);
  const delay = Math.max(0, reminderTime.getTime() - Date.now());
  
  notificationQueue.add({
    tenantId,
    triggerType: "appointment_reminder",
    personId: clientPersonId,
    recipientContact: "client_contact_placeholder", // Typically fetch the Client Person's email/phone here
    variables: {
      time: new Date(scheduledStart).toLocaleString()
    }
  }, { delay });

  return sendSuccess(res, appointment, "Appointment created successfully", 201);
}

export async function updateAppointment(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { scheduledStart, scheduledEnd, status } = req.body;

  const appointment = await Appointment.findOne({ _id: req.params.id, tenantId });
  if (!appointment) return sendError(res, 404, "Appointment not found");

  // Prevent reschedule to conflicting time
  if (scheduledStart && scheduledEnd) {
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      tenantId,
      practitionerPersonId: appointment.practitionerPersonId,
      status: { $in: ["booked", "in_progress"] },
      $or: [
        { scheduledStart: { $lt: new Date(scheduledEnd), $gte: new Date(scheduledStart) } },
        { scheduledEnd: { $gt: new Date(scheduledStart), $lte: new Date(scheduledEnd) } },
      ]
    });

    if (conflict) {
      return sendError(res, 400, "The selected practitioner is already booked for this time slot.");
    }
  }

  const updated = await Appointment.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { $set: req.body },
    { new: true }
  ).populate("clientPersonId").populate("serviceId").populate("practitionerPersonId");

  // Emit socket event
  const io = getIO();
  io.to(`tenant:${tenantId}`).emit("appointment_updated", updated);

  return sendSuccess(res, updated, "Appointment updated successfully");
}

export async function completeAppointment(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { beforePhotoUrl, afterPhotoUrl, productsUsed, outcomeNotes } = req.body;

  const appointment = await Appointment.findOne({ _id: req.params.id, tenantId });
  if (!appointment) return sendError(res, 404, "Appointment not found");
  if (appointment.status === "completed") return sendError(res, 400, "Appointment is already completed");

  // Create session log
  const sessionLog = await SessionLog.create({
    appointmentId: appointment._id,
    beforePhotoUrl,
    afterPhotoUrl,
    productsUsed,
    outcomeNotes
  });

  // Update appointment status
  appointment.status = "completed";
  await appointment.save();

  // Get the service catalog to figure out pricing
  const service = await ServiceCatalog.findById(appointment.serviceId);
  const price = appointment.practitionerRole === "student" ? service?.priceSupervised : service?.priceSolo;

  // Phase 5: Inventory Deduction
  if (productsUsed && Array.isArray(productsUsed)) {
    for (const pu of productsUsed) {
      if (pu.productId && pu.quantityUsed) {
        // Deduct from stock
        await Product.findOneAndUpdate(
          { _id: pu.productId },
          { $inc: { currentStock: -pu.quantityUsed } }
        );
        // Record deduction
        await ProductUsageDeduction.create({
          sessionLogId: sessionLog._id,
          productId: pu.productId,
          quantityUsed: pu.quantityUsed
        });
        
        // Phase 7: Low Stock Alert
        const updatedProduct = await Product.findById(pu.productId);
        if (updatedProduct && updatedProduct.currentStock <= updatedProduct.reorderThreshold) {
          notificationQueue.add({
            tenantId,
            triggerType: "low_stock",
            overrideChannel: "email",
            recipientContact: "manager@beautystudio.com", // Send to branch manager
            variables: {
              productName: updatedProduct.name,
              stock: updatedProduct.currentStock
            }
          });
        }
      }
    }
  }

  // Phase 5: Generate Service Invoice
  if (service && price) {
    await Invoice.create({
      tenantId,
      branchId: appointment.branchId,
      type: "service",
      clientOrStudentPersonId: appointment.clientPersonId,
      appointmentId: appointment._id,
      lineItems: [
        {
          description: `${service.name} (${appointment.practitionerRole} rate)`,
          amount: price,
        }
      ],
      totalAmount: price,
      status: "unpaid"
    });
  }

  // Phase 5: Generate Commission (Only for Stylists)
  if (appointment.practitionerRole === "stylist" && service && price) {
    // Arbitrary commission rate for MVP (e.g., 40%)
    const commissionRate = 0.40;
    await Commission.create({
      staffPersonId: appointment.practitionerPersonId,
      appointmentId: appointment._id,
      amount: price * commissionRate,
      basis: "solo_service"
    });
  }

  // Integration Spine: Check curriculum progress (Phase 3 & 4)
  if (appointment.practitionerRole === "student") {
    if (service && service.mappedCurriculumItemId) {
      await CurriculumProgressCredit.create({
        studentPersonId: appointment.practitionerPersonId,
        curriculumItemId: service.mappedCurriculumItemId,
        sessionLogId: sessionLog._id
      });
      
      // Hook into Phase 4 recalculation
      const curriculumItem = await CurriculumItem.findById(service.mappedCurriculumItemId);
      if (curriculumItem) {
        const module = await CourseModule.findById(curriculumItem.moduleId);
        if (module) {
          await recalculateStatus(
            appointment.practitionerPersonId.toString(),
            module.courseId.toString()
          );
        }
      }
    }
  }

  // Emit socket event
  const io = getIO();
  io.to(`tenant:${tenantId}`).emit("appointment_updated", appointment);

  return sendSuccess(res, { appointment, sessionLog }, "Session logged, invoice generated, and appointment completed");
}
