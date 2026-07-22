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
import loyaltyRoutes from "./modules/loyalty/loyalty.routes";
import publicRoutes from "./modules/public/public.routes";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import rbacRoutes from "./modules/rbac/rbac.routes";
import documentRoutes from "./modules/documents/documents.routes";
import serviceRequestRoutes from "./modules/service-requests/service-requests.routes";


import portalRoutes from "./modules/portal/portal.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import aiRoutes from "./modules/ai/ai.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import systemRoutes from "./modules/system/system.routes";
import featureFlagsRoutes from "./modules/feature-flags/feature-flags.routes";
import auditRoutes from "./modules/audit/audit.routes";
import marketingRoutes from "./modules/marketing/marketing.routes";
// Phase 2 — Department Modules
import adminDocumentRoutes from "./modules/admin-documents/admin-documents.routes";
import approvalRoutes from "./modules/approvals/approval.routes";
import ledgerRoutes from "./modules/ledger/ledger.routes";
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.routes";
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
    service: "beauty-studio-os-api", 
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
v1.use("/documents",         documentRoutes);
v1.use("/marketing",         marketingRoutes);
v1.use("/service-requests",  serviceRequestRoutes);
v1.use("/loyalty",           loyaltyRoutes);
v1.use("/public",            publicRoutes);

v1.use("/portal",            portalRoutes);
v1.use("/notifications",     notificationRoutes);
v1.use("/reports",           reportsRoutes);
v1.use("/ai",                requireFeature("ai"), aiRoutes);
v1.use("/audit-logs",        auditRoutes);
v1.use("/upload",            uploadRoutes);
v1.use("/system",            systemRoutes);
v1.use("/feature-flags",     featureFlagsRoutes);
// Phase 2 — Department modules
v1.use("/admin-documents",         adminDocumentRoutes);
v1.use("/approvals",               approvalRoutes);
v1.use("/ledger",                  ledgerRoutes);
// Phase 3 — Depth
v1.use("/subscriptions",           subscriptionsRoutes);

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
