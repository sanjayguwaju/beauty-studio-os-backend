import { Router } from "express";
import { asyncHandler } from "../../middleware/async.middleware";
import * as controller from "./ai.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// Recommendations (Can be viewed by staff or client)
// We'll loosely authorize with "read AiFeature" or similar. Let's use "AiFeature" CaslSubject
router.post("/recommendations/:personId", authorize("create", "AiFeature"), asyncHandler(controller.generateRecommendations));
router.get("/recommendations/:personId", authorize("read", "AiFeature"), asyncHandler(controller.getRecommendations));
router.patch("/recommendations/:id/dismiss", authorize("update", "AiFeature"), asyncHandler(controller.dismissRecommendation));

// OCR Intake
router.post("/ocr/process", authorize("create", "AiFeature"), asyncHandler(controller.processOcr));
router.get("/ocr/pending", authorize("read", "AiFeature"), asyncHandler(controller.getPendingOcr));
router.post("/ocr/:id/approve", authorize("update", "AiFeature"), asyncHandler(controller.approveOcr));

export default router;
