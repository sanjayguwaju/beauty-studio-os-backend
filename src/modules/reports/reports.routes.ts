import { Router } from "express";
import * as controller from "./reports.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";

const router = Router();

router.use(authenticate);

// We'll map "Report" to the "DashboardAnalytics" or a new "Report" CaslSubject. Let's use "Report".
router.get("/kpis", authorize("read", "Report"), controller.getKPIs);
router.get("/export", authorize("read", "Report"), controller.exportReport);

export default router;
