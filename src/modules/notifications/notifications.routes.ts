import { Router } from "express";
import * as controller from "./notifications.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.get("/", controller.listMyNotifications);
router.put("/read", controller.markRead);

// Phase 7 - Communications Center
router.get("/templates", controller.listTemplates);
router.post("/templates", controller.createTemplate);
router.put("/templates/:id", controller.updateTemplate);

router.get("/logs", controller.listLogs);
router.post("/send-promo", controller.sendPromo);

export default router;
