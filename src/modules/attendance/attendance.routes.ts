import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./attendance.controller";

const router = Router();

router.use(authenticate);

router.get("/batches/:batchId", asyncHandler(controller.getAttendanceForBatch));
router.post("/sync", asyncHandler(controller.syncAttendance));

export default router;
