import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./appointments.controller";

const router = Router();

router.use(authenticate);

router.get("/", controller.listAppointments);
router.post("/", controller.createAppointment);
router.put("/:id", controller.updateAppointment);
router.post("/:id/complete", controller.completeAppointment);

export default router;
