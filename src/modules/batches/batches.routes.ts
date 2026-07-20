import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./batches.controller";

const router = Router();

router.use(authenticate);

// Batches
router.get("/", asyncHandler(controller.listBatches));
router.post("/", asyncHandler(controller.createBatch));
router.get("/:id", asyncHandler(controller.getBatch));
router.put("/:id", asyncHandler(controller.updateBatch));
router.delete("/:id", asyncHandler(controller.deleteBatch));

// Enrollments
router.post("/enrollments", asyncHandler(controller.enrollStudent));
router.put("/enrollments/:id", asyncHandler(controller.updateEnrollmentStatus));

export default router;
