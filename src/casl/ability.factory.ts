import {
  AbilityBuilder,
  MongoAbility,
  createMongoAbility,
  ForcedSubject,
} from "@casl/ability";
import { AuthUser, SystemRole, PermissionAction, CaslSubject } from "../types";
import { IRole } from "../models/Role";

// ─── CASL Ability Type ──────────────────────────────────────────────────────
export type Actions = PermissionAction;
export type Subjects = CaslSubject | ForcedSubject<CaslSubject>;
export type AppAbility = MongoAbility<[Actions, Subjects]>;

// ─── Subject detection ──────────────────────────────────────────────────────
// We use the __caslSubjectType__ field on plain objects instead of class names,
// avoiding mutation of RSC-incompatible objects.
function detectSubjectType(subject: Subjects): CaslSubject {
  if (typeof subject === "string") return subject as CaslSubject;
  if (typeof subject === "object" && subject !== null) {
    const typed = subject as unknown as Record<string, unknown>;
    if (typed.__caslSubjectType__) return typed.__caslSubjectType__ as CaslSubject;
    // Fallback: check _type hint
    if (typed._type) return typed._type as CaslSubject;
  }
  return "all";
}

// ─── Tag a plain object with its CASL subject type ─────────────────────────
// Always spread to avoid mutation (RSC compatible).
export function tag<T extends object>(type: CaslSubject, obj: T): T & { __caslSubjectType__: CaslSubject } {
  return { ...obj, __caslSubjectType__: type };
}

// ─── Ability Factory ────────────────────────────────────────────────────────
export function buildAbility(user: AuthUser, permissions: { module: string; action: string }[]): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const rolesToSet = user.roleAssignments ? user.roleAssignments.map(ra => ra.role) : user.roles;
  const roleSet = new Set(rolesToSet);

  // Enforce dashboard_overview isolation
  cannot("read", "DashboardAnalytics", { type: "overview" } as any);

  // Map frontend module slugs (snake_case) to Backend CaslSubjects (PascalCase)
  const frontendModuleToSubjectMap: Record<string, CaslSubject[]> = {
    dashboard: ["Dashboard", "DashboardAnalytics"],
    rbac: ["Role"],
    users: ["User"],
    citizens: ["Citizen"],
    complaints: ["Complaint"],
    service_requests: ["ServiceRequest"],
    registration: ["Registration"],
    correspondence: ["Correspondence"],
    documents: ["Document", "ApprovableDocument"],
    notifications: ["Notification"],
    audit: ["AuditLog"],
    health: ["HealthPost", "HealthInventory"],
    education: ["School", "SchoolPerformance", "EducationInventory"],
    infrastructure: ["InfraProject", "InfraMilestone", "InfraPayment"],
    agriculture: ["LivestockRecord", "AgricultureInventory"],
    finance: ["LedgerEntry", "BudgetAllocation", "RevenueCollection"],
    administrative: ["Ward", "AdminDocument", "AdminSignature"],
    disaster_management: ["DisasterIncident", "DamageAssessment", "ReliefApplication"],
    inventory: ["InventoryItem", "InventoryTransaction", "Distribution"],
    feature_flags: ["FeatureFlag"],
    services: ["ServiceCatalog"],
    clients: ["ClientProfile"],
    staff: ["StaffProfile"],
    // Phase 2
    courses: ["Course", "CourseModule", "CurriculumItem"],
    batches: ["Batch", "Enrollment"],
    attendance: ["Batch", "AttendanceRecord"],
    // Phase 3
    appointments: ["Appointment", "SessionLog", "CurriculumProgressCredit"],
    // Phase 4
    certifications: ["CertificationRequirement", "CertificationStatus", "Certificate"],
    // Phase 5
    products: ["Product", "ProductUsageDeduction"],
    billing: ["Invoice", "Commission"],
    // Phase 6
    portal: ["Portal"],
    // Phase 8
    reports: ["Report"],
    // Phase 9
    ai: ["AiFeature"],
  };

  // Build permissions from cached permissions array
  for (const perm of permissions) {
    // Map the string stored in the database to the actual backend CaslSubject(s)
    const subjects = frontendModuleToSubjectMap[perm.module] || [perm.module as CaslSubject];
    for (const subject of subjects) {
      can(perm.action as Actions, subject);
    }
  }

  // ── Identity-based supplementary rules ──────────────────────────────────────

  // Self-service reads for all users
  can("read", "Notification", { recipientId: user.id } as any);
  if (user.email) {
    can("read", "ServiceRequest", { "applicantEmail": user.email } as any);
    can("read", "Complaint", { "complainantPhone": user.email } as any);
  }

  return build({ detectSubjectType });
}


