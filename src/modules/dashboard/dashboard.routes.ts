import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import {
  getOverviewDashboard,
  getFinanceDashboard,
  getInfrastructureDashboard,
  getHealthDashboard,
  getEducationDashboard,
  getAgricultureDashboard,
  getDisasterDashboard,
} from "./dashboard.controller";

const router = Router();
router.use(authenticate);

// We keep summary for backward compatibility, mapped to overview
router.get("/summary", authorize("read", "DashboardAnalytics"), getOverviewDashboard);

router.get("/overview", authorize("read", "DashboardAnalytics"), getOverviewDashboard);
router.get("/finance", authorize("read", "Dashboard"), getFinanceDashboard);
router.get("/infrastructure", authorize("read", "Dashboard"), getInfrastructureDashboard);
router.get("/health", authorize("read", "Dashboard"), getHealthDashboard);
router.get("/education", authorize("read", "Dashboard"), getEducationDashboard);
router.get("/agriculture", authorize("read", "Dashboard"), getAgricultureDashboard);
router.get("/disaster-management", authorize("read", "Dashboard"), getDisasterDashboard);

export default router;
