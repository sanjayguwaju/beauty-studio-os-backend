import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./appointments.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.listAppointments));
router.post("/", asyncHandler(controller.createAppointment));
router.put("/:id", asyncHandler(controller.updateAppointment));
router.post("/:id/complete", asyncHandler(controller.completeAppointment));

export default router;
