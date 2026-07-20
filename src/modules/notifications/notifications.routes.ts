import { Router } from "express";
import { asyncHandler } from "../../middleware/async.middleware";
import * as controller from "./notifications.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.listMyNotifications));
router.put("/read", asyncHandler(controller.markRead));

// Phase 7 - Communications Center
router.get("/templates", asyncHandler(controller.listTemplates));
router.post("/templates", asyncHandler(controller.createTemplate));
router.put("/templates/:id", asyncHandler(controller.updateTemplate));

router.get("/logs", asyncHandler(controller.listLogs));
router.post("/send-promo", asyncHandler(controller.sendPromo));

export default router;
