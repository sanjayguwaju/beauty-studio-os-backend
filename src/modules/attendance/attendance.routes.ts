import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./attendance.controller";

const router = Router();

router.use(authenticate);

router.get("/batches/:batchId", controller.getAttendanceForBatch);
router.post("/sync", controller.syncAttendance);

export default router;
