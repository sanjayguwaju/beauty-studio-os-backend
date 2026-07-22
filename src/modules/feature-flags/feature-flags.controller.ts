import { Response } from "express";
import { AuthRequest } from "../../types";
import { FeatureFlag } from "../../models/FeatureFlag";
import { sendSuccess, sendError } from "../../utils/response";

export const SYSTEM_FEATURE_FLAGS = [
  { key: "client_portal", name: "Client Portal", description: "Enable the public client self-service portal", isSystemFlag: true },
  { key: "online_payment", name: "Online Payment", description: "Enable online invoice payment via Stripe or eSewa", isSystemFlag: true },
  { key: "sms_notifications", name: "SMS Notifications", description: "Send SMS alerts to clients and students", isSystemFlag: true },
  { key: "academy", name: "Academy Module", description: "Course builder, batches, enrollment, and attendance tracking", isSystemFlag: true },
  { key: "ai", name: "AI Layer", description: "AI-powered OCR intake and service recommendations", isSystemFlag: true },
  { key: "certifications", name: "Certifications", description: "Student certification rules, progress tracking, and certificate issuance", isSystemFlag: true },
  { key: "pos_billing", name: "POS & Billing", description: "Point-of-sale checkout, invoicing, and commission tracking", isSystemFlag: true },
  { key: "inventory", name: "Inventory Management", description: "Product stock tracking and usage deductions per appointment", isSystemFlag: true },
  { key: "staff_commissions", name: "Staff Commissions", description: "Per-service commission calculation and reporting", isSystemFlag: true },
  { key: "multi_branch", name: "Multi-Branch", description: "Manage multiple studio branches under one tenant", isSystemFlag: true },
  { key: "student_portal", name: "Student Portal", description: "Dedicated portal for academy students to view schedule and progress", isSystemFlag: true },
  { key: "webhooks", name: "Webhooks", description: "Dispatch webhook events to external systems on key actions", isSystemFlag: true },
  { key: "analytics", name: "Analytics & Reports", description: "Revenue KPIs, staff performance, and export capabilities", isSystemFlag: true },
  { key: "loyalty_program", name: "Loyalty Program", description: "Client loyalty points and rewards tracking", isSystemFlag: true },
  { key: "e_attendance", name: "E-Attendance", description: "Staff and student digital attendance system", isSystemFlag: true },
];

import { tenantContext } from "../../utils/tenantContext";

export async function getSystemFeatureFlags(req: AuthRequest, res: Response) {
  const dbSystemFlags = await tenantContext.run(
    { bypassTenant: true, tenantId: "system" },
    () => FeatureFlag.find({ isSystemFlag: true })
  );
  
  // Create a map to deduplicate by key (preferring DB over hardcoded)
  const flagsMap = new Map();
  
  SYSTEM_FEATURE_FLAGS.forEach(f => flagsMap.set(f.key, f));
  dbSystemFlags.forEach(f => flagsMap.set(f.key, {
    key: f.key,
    name: f.name,
    description: f.description,
    isSystemFlag: true
  }));

  const combinedFlags = Array.from(flagsMap.values());
  console.log("COMBINED FLAGS COUNT:", combinedFlags.length);
  return sendSuccess(res, combinedFlags);
}

export async function createSystemFeatureFlag(req: AuthRequest, res: Response) {
  try {
    const { key, name, description } = req.body;
    if (!key || !name) {
      return sendError(res, 400, "Key and name are required");
    }
    
    // Check if it already exists in DB
    const existing = await FeatureFlag.findOne({ key, isSystemFlag: true });
    if (existing) {
      return sendError(res, 400, "A system feature flag with this key already exists");
    }

    const flag = await FeatureFlag.create({
      key,
      name,
      description,
      isSystemFlag: true,
      isActive: false // System flag definitions themselves don't dictate active state
    });
    
    return sendSuccess(res, flag, "System feature flag created", 201);
  } catch (err: any) {
    if (err.code === 11000) {
      return sendError(res, 400, "A system feature flag with this key already exists");
    }
    throw err;
  }
}

export async function listFeatureFlags(req: AuthRequest, res: Response) {
  const query: any = {};
  const isSuperAdmin = req.user?.roles?.includes("platform_admin");
  
  if (!isSuperAdmin && req.user?.tenantId) {
    query.tenantId = req.user.tenantId;
  }

  const flags = await tenantContext.run(
    { bypassTenant: isSuperAdmin, tenantId: req.user?.tenantId },
    () => FeatureFlag.find(query).sort("name")
  );
  return sendSuccess(res, flags);
}

export async function createFeatureFlag(req: AuthRequest, res: Response) {
  try {
    const flagData = { ...req.body };
    if (req.user?.tenantId && !flagData.tenantId) {
      flagData.tenantId = req.user.tenantId;
    }
    const flag = await FeatureFlag.create(flagData);
    return sendSuccess(res, flag, "Feature flag created", 201);
  } catch (err: any) {
    if (err.code === 11000) {
      return sendError(res, 400, "A feature flag with this key already exists");
    }
    throw err;
  }
}

export async function updateFeatureFlag(req: AuthRequest, res: Response) {
  const query: any = { _id: req.params.id };
  if (req.user?.tenantId) query.tenantId = req.user.tenantId;
  const flag = await FeatureFlag.findOneAndUpdate(
    query,
    { $set: req.body },
    { new: true }
  );
  if (!flag) return sendError(res, 404, "Feature flag not found");
  return sendSuccess(res, flag, "Feature flag updated");
}

export async function deleteFeatureFlag(req: AuthRequest, res: Response) {
  const query: any = { _id: req.params.id };
  if (req.user?.tenantId) query.tenantId = req.user.tenantId;
  const flag = await FeatureFlag.findOneAndDelete(query);
  if (!flag) return sendError(res, 404, "Feature flag not found");
  return sendSuccess(res, null, "Feature flag deleted");
}
