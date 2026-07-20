import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env";
import logger from "./config/logger";
import { authenticate } from "./middleware/auth.middleware";
import { requireFeature } from "./middleware/subscription.middleware";
import { publicRateLimit } from "./middleware/rateLimit.middleware";
import { GlobalExceptionHandler } from "./middleware/error.middleware";
import mongoose from "mongoose";
import { redis } from "./config/redis";

import { apiReference } from "@scalar/express-api-reference";
import openapiSpec from "./docs/openapi.json";

// Routes
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import rbacRoutes from "./modules/rbac/rbac.routes";
import wardRoutes from "./modules/wards/wards.routes";
import citizenRoutes from "./modules/citizens/citizens.routes";
import documentRoutes from "./modules/documents/documents.routes";
import correspondenceRoutes from "./modules/correspondence/correspondence.routes";
import serviceRequestRoutes from "./modules/service-requests/service-requests.routes";
import registrationRoutes from "./modules/registration/registration.routes";
import complaintRoutes from "./modules/complaints/complaints.routes";
import academyRoutes from "./modules/academy/academy.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import portalRoutes from "./modules/portal/portal.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import aiRoutes from "./modules/ai/ai.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import systemRoutes from "./modules/system/system.routes";
import featureFlagsRoutes from "./modules/feature-flags/feature-flags.routes";
import onboardingRoutes from "./modules/onboarding/onboarding.routes";
// Phase 2 — Department Modules
import healthPostRoutes from "./modules/health-posts/health-posts.routes";
import { healthInventoryRouter, educationInventoryRouter, agricultureInventoryRouter } from "./modules/inventory/inventory.routes";
import schoolRoutes from "./modules/schools/schools.routes";
import infraProjectRoutes from "./modules/infra-projects/infra-projects.routes";
import livestockRoutes from "./modules/livestock/livestock.routes";
import disasterIncidentRoutes from "./modules/disaster-incidents/disaster-incidents.routes";
import reliefApplicationRoutes from "./modules/relief-applications/relief-applications.routes";
import adminDocumentRoutes from "./modules/admin-documents/admin-documents.routes";
import approvalRoutes from "./modules/approvals/approval.routes";
import ledgerRoutes from "./modules/ledger/ledger.routes";
import { budgetRouter, revenueRouter } from "./modules/finance/finance.routes";
import sifarisRoutes from "./modules/sifaris/sifaris.routes";
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.routes";
import vitalEventsRoutes from "./modules/vital-events/vital-events.routes";
import taxEngineRoutes from "./modules/tax-engine/tax-engine.routes";
import citizenPortalRoutes from "./modules/citizen-portal/citizen-portal.routes";
// Phase 1 - Beauty Studio OS
import servicesRoutes from "./modules/services/services.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import staffRoutes from "./modules/staff/staff.routes";

// Phase 2 - Academy Core
import coursesRoutes from "./modules/courses/courses.routes";
import batchesRoutes from "./modules/batches/batches.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";

// Phase 3 - Booking Engine
import appointmentsRoutes from "./modules/appointments/appointments.routes";

// Phase 4 - Certifications
import certificationsRoutes from "./modules/certifications/certifications.routes";

// Phase 5 - Inventory & Billing
import productsRoutes from "./modules/products/products.routes";
import billingRoutes from "./modules/billing/billing.routes";

// Phase 6 - Portals

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net", "https://validator.swagger.io"],
    },
  },
}));
app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(publicRateLimit);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const redisStatus = redis.status === "ready" ? "connected" : "disconnected";
  const isHealthy = dbStatus === "connected" && redisStatus === "connected";
  const status = isHealthy ? "ok" : "degraded";

  let message = "All core services and dependencies are fully operational.";
  if (!isHealthy) {
    const issues = [];
    if (dbStatus === "disconnected") issues.push("Database (MongoDB)");
    if (redisStatus === "disconnected") issues.push("Cache (Redis)");
    message = `The API is running, but with degraded functionality. Unreachable dependencies: ${issues.join(", ")}.`;
  }

  res.json({ 
    status, 
    message,
    service: "palika-os-api", 
    timestamp: new Date().toISOString(),
    dependencies: {
      database: {
        status: dbStatus,
        message: dbStatus === "connected" ? "Successfully connected to MongoDB" : "Failed to connect to MongoDB. Core data cannot be read or written."
      },
      redis: {
        status: redisStatus,
        message: redisStatus === "connected" ? "Successfully connected to Redis" : "Failed to connect to Redis. Rate limiting, sockets, or caching may fallback or fail."
      }
    }
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const v1 = express.Router();

v1.use("/auth",              authRoutes);
v1.use("/users",             userRoutes);
v1.use("/roles",             rbacRoutes);
v1.use("/wards",             wardRoutes);
v1.use("/citizens",          citizenRoutes);
v1.use("/documents",         documentRoutes);
v1.use("/correspondence",    correspondenceRoutes);
v1.use("/service-requests",  serviceRequestRoutes);
v1.use("/registration",      registrationRoutes);
v1.use("/complaints",        complaintRoutes);
v1.use("/academy",           requireFeature("academy"), academyRoutes);
v1.use("/portal",            portalRoutes);
v1.use("/notifications",     notificationRoutes);
v1.use("/reports",           reportsRoutes);
v1.use("/ai",                requireFeature("ai"), aiRoutes);
v1.use("/audit-logs",        auditRoutes);
v1.use("/upload",            uploadRoutes);
v1.use("/system",            systemRoutes);
v1.use("/feature-flags",     featureFlagsRoutes);
v1.use("/onboarding",        onboardingRoutes);
// Phase 2 — Department modules
v1.use("/health-posts",            healthPostRoutes);
v1.use("/health-inventory",        healthInventoryRouter);
v1.use("/education-inventory",     educationInventoryRouter);
v1.use("/agriculture-inventory",   agricultureInventoryRouter);
v1.use("/schools",                 schoolRoutes);
v1.use("/infra-projects",          infraProjectRoutes);
v1.use("/livestock",               livestockRoutes);
v1.use("/disaster-incidents",      disasterIncidentRoutes);
v1.use("/relief-applications",     reliefApplicationRoutes);
v1.use("/admin-documents",         adminDocumentRoutes);
v1.use("/approvals",               approvalRoutes);
v1.use("/ledger",                  ledgerRoutes);
// Phase 3 — Depth
v1.use("/budget-allocations",      budgetRouter);
v1.use("/revenue-collections",     revenueRouter);
v1.use("/sifaris",                 sifarisRoutes);
v1.use("/subscriptions",           subscriptionsRoutes);
v1.use("/vital-events",            vitalEventsRoutes);
v1.use("/tax-engine",              taxEngineRoutes);
v1.use("/citizen",                 citizenPortalRoutes);

// Phase 1 - Beauty Studio OS
v1.use("/services",                servicesRoutes);
v1.use("/clients",                 clientsRoutes);
v1.use("/staff",                   staffRoutes);

// Phase 2 - Academy Core
v1.use("/courses",                 coursesRoutes);
v1.use("/batches",                 batchesRoutes);
v1.use("/attendance",              attendanceRoutes);

// Phase 3 - Booking Engine
v1.use("/appointments",            appointmentsRoutes);

// Phase 4 - Certifications
v1.use("/certifications",          certificationsRoutes);

// Phase 5 - Inventory & Billing
v1.use("/products",                productsRoutes);
v1.use("/billing",                 billingRoutes);

// Phase 6 - Portals
v1.use("/portal",                  portalRoutes);

app.use("/api/v1", v1);

// ─── API Documentation ──────────────────────────────────────────────────────────
app.use(
  "/reference",
  apiReference({
    theme: "purple",
    spec: {
      content: openapiSpec,
    },
  })
);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(GlobalExceptionHandler);

export default app;
