import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./portal.controller";

const router = Router();

router.use(authenticate);

// Client Routes
router.get("/client/appointments", controller.getClientAppointments);
router.post("/client/appointments", controller.bookClientAppointment);
router.get("/client/invoices", controller.getClientInvoices);

// Student Routes
router.get("/student/schedule", controller.getStudentSchedule);
router.get("/student/progress", controller.getStudentProgress);
router.get("/student/certificates", controller.getStudentCertificates);

export default router;
