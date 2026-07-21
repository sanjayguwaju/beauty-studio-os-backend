import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { AppAbility } from "../casl/ability.factory";

// ─── System Roles ──────────────────────────────────────────────────────────────
export type SystemRole =
  | "platform_admin"
  | "municipality_admin"
  | "section_head"
  | "ward_officer"
  | "staff"
  | "citizen";

// ─── Module Slugs ──────────────────────────────────────────────────────────────
export const MODULES = [
  "wards", "citizens", "documents", "correspondence",
  "service_requests", "registration", "complaints",
  "portal", "dashboard", "hr", "finance", "tax",
  "meetings", "budget", "assets", "procurement",
  "projects", "reports", "rbac", "audit", "notifications", "feature_flags",
  // Phase 2 — Department modules
  "health", "health_inventory",
  "education", "education_inventory",
  "infrastructure", "infra_milestones",
  "agriculture", "agriculture_inventory",
  "livestock",
  "disaster_management", "relief_applications",
  "administrative", "admin_signatures",
  "finance_ledger",
  "approvals",
  // Phase 3 — Budget & Infra depth
  "budget", "revenue", "infra_payments",
  "dashboard_overview", "dashboard_health", "dashboard_education",
  "dashboard_infrastructure", "dashboard_agriculture",
  "dashboard_disaster_management", "dashboard_finance",
  // Phase 1 - Beauty Studio OS
  "services", "clients", "staff",
  // Phase 2 - Academy Core
  "courses", "batches", "attendance",
  // Phase 3 - Booking Engine
  "appointments",
  // Phase 4 - Certifications
  "certifications",
  // Phase 5 - Inventory & Billing
  "products", "billing",
  // Phase 6 - Portals
  "portal",
  // Phase 8 - Reports
  "reports",
  // Phase 9 - AI
  "ai"
] as const;
export type ModuleSlug = (typeof MODULES)[number];

// ─── Permission Actions ────────────────────────────────────────────────────────
export type PermissionAction = "create" | "read" | "update" | "delete" | "approve" | "export" | "manage";

// ─── CASL Subjects ─────────────────────────────────────────────────────────────
export type CaslSubject =
  | "Ward" | "Citizen" | "Document" | "Correspondence"
  | "ServiceRequest" | "Registration" | "Complaint"
  | "Notification" | "AuditLog" | "User" | "Role"
  | "Dashboard" | "FeatureFlag"
  // Phase 2 — Health
  | "HealthPost" | "HealthInventory"
  // Phase 2 — Education
  | "School" | "SchoolPerformance" | "EducationInventory"
  // Phase 2 — Infrastructure
  | "InfraProject" | "InfraMilestone"
  // Phase 2 — Agriculture
  | "LivestockRecord" | "AgricultureInventory"
  // Phase 2 — Shared Inventory
  | "InventoryItem" | "InventoryTransaction" | "Distribution"
  // Phase 2 — Disaster
  | "DisasterIncident" | "DamageAssessment" | "ReliefApplication"
  // Phase 2 — Administrative
  | "AdminDocument" | "AdminSignature"
  // Phase 2 — Finance
  | "LedgerEntry"
  // Phase 2 — Approvals
  | "ApprovableDocument"
  // Phase 3 — Depth & Analytics
  | "BudgetAllocation" | "RevenueCollection" | "InfraPayment" | "DashboardAnalytics"
  | "Finance" | "VitalEvent" | "TaxRule"
  // Phase 1 - Beauty Studio OS
  | "ServiceCatalog" | "ClientProfile" | "StaffProfile"
  // Phase 2 - Academy Core
  | "Course" | "CourseModule" | "CurriculumItem" | "Batch" | "Enrollment" | "AttendanceRecord"
  // Phase 3 - Booking Engine
  | "Appointment" | "SessionLog" | "CurriculumProgressCredit"
  // Phase 4 - Certifications
  | "CertificationRequirement" | "CertificationStatus" | "Certificate"
  // Phase 5 - Inventory & Billing
  | "Product" | "ProductUsageDeduction" | "Invoice" | "Commission"
  // Phase 6 - Portals
  | "Portal"
  // Phase 8 - Reports
  | "Report"
  // Phase 9 - AI
  | "AiFeature"
  | "all";

// ─── Authenticated Request ─────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  municipalityId: string;
  wardId?: string;
  roles: SystemRole[];
  tenantId?: string;
  branchId?: string;
  personId?: string;
  roleAssignments?: Array<{
    tenantId: string;
    branchId?: string;
    role: string;
  }>;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  ability?: AppAbility;
}

// ─── JWT Payload ───────────────────────────────────────────────────────────────
export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  municipalityId: string;
  wardId?: string;
  roles: SystemRole[];
  tenantId?: string;
}

// ─── API Envelope ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}
