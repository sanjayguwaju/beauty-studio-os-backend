import { Router } from "express";
import { asyncHandler } from "../../middleware/async.middleware";
import * as controller from "./reports.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// We'll map "Report" to the "DashboardAnalytics" or a new "Report" CaslSubject. Let's use "Report".
router.get("/kpis", authorize("read", "Report"), asyncHandler(controller.getKPIs));
router.get("/export", authorize("read", "Report"), asyncHandler(controller.exportReport));

export default router;
