import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./portal.controller";

const router = Router();

router.use(authenticate);

// Client Routes
router.get("/client/appointments", asyncHandler(controller.getClientAppointments));
router.post("/client/appointments", asyncHandler(controller.bookClientAppointment));
router.get("/client/invoices", asyncHandler(controller.getClientInvoices));

// Student Routes
router.get("/student/schedule", asyncHandler(controller.getStudentSchedule));
router.get("/student/progress", asyncHandler(controller.getStudentProgress));
router.get("/student/certificates", asyncHandler(controller.getStudentCertificates));

export default router;
