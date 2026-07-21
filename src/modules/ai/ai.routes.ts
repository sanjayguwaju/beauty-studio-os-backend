import { Router } from "express";
import * as controller from "./ai.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = Router();

router.use(authenticate);

// Recommendations (Can be viewed by staff or client)
// We'll loosely authorize with "read AiFeature" or similar. Let's use "AiFeature" CaslSubject
router.post("/recommendations/:personId", authorize("create", "AiFeature"), controller.generateRecommendations);
router.get("/recommendations/:personId", authorize("read", "AiFeature"), controller.getRecommendations);
router.patch("/recommendations/:id/dismiss", authorize("update", "AiFeature"), controller.dismissRecommendation);

// OCR Intake
router.post("/ocr/process", authorize("create", "AiFeature"), controller.processOcr);
router.get("/ocr/pending", authorize("read", "AiFeature"), controller.getPendingOcr);
router.post("/ocr/:id/approve", authorize("update", "AiFeature"), controller.approveOcr);

export default router;
