import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./batches.controller";

const router = Router();

router.use(authenticate);

// Batches
router.get("/", controller.listBatches);
router.post("/", controller.createBatch);
router.get("/:id", controller.getBatch);
router.put("/:id", controller.updateBatch);
router.delete("/:id", controller.deleteBatch);

// Enrollments
router.post("/enrollments", controller.enrollStudent);
router.put("/enrollments/:id", controller.updateEnrollmentStatus);

export default router;
