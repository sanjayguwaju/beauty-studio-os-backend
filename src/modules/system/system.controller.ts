import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { redis } from "../../config/redis";
import { Tenant } from "../../models/Tenant";
import { TenantSubscription } from "../../models/TenantSubscription";
import { SubscriptionPlan } from "../../models/SubscriptionPlan";
import { Person } from "../../models/Person";
import { User } from "../../models/User";
import { Role } from "../../models/Role";
import { RoleAssignment } from "../../models/RoleAssignment";
import { Branch } from "../../models/Branch";
import { ImpersonationLog } from "../../models/ImpersonationLog";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../../config/auth";

export async function getRedisStats(req: AuthRequest, res: Response) {
  try {
    const info = await redis.info();
    const dbsize = await redis.dbsize();
    
    // Parse memory usage from info string
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const usedMemory = memoryMatch ? memoryMatch[1] : "Unknown";

    return sendSuccess(res, {
      status: redis.status,
      keysCount: dbsize,
      usedMemory,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to get Redis stats");
  }
}

export async function clearRedisCache(req: AuthRequest, res: Response) {
  try {
    const { target = "all" } = req.body;
    
    let keysToDelete: string[] = [];
    
    // We use keys() here instead of flushdb to avoid deleting background job queues (like BullMQ)
    if (target === "permissions" || target === "all") {
      const permKeys = await redis.keys("permissions:role:*");
      keysToDelete.push(...permKeys);
    }
    
    if (target === "sessions" || target === "all") {
      const sessionKeys = await redis.keys("session:user:*");
      keysToDelete.push(...sessionKeys);
    }

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }

    return sendSuccess(res, { cleared: keysToDelete.length }, `Successfully cleared ${keysToDelete.length} cache keys`);
  } catch (error) {
    return sendError(res, 500, "Failed to clear Redis cache");
  }
}

export async function getTenants(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { subdomain: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Tenant.countDocuments(query);
    const tenants = await Tenant.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return sendPaginated(res, tenants, total, page, limit);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch tenants");
  }
}

export async function updateTenantStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return sendError(res, 400, "Invalid status");
    }

    const tenant = await Tenant.findByIdAndUpdate(id, { status }, { new: true });
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, tenant, `Tenant status updated to ${status}`);
  } catch (error) {
    return sendError(res, 500, "Failed to update tenant status");
  }
}

export async function updateTenant(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, subdomain, type, code } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { name, subdomain, type, code },
      { new: true }
    );
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, tenant, "Tenant updated successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to update tenant");
  }
}

export async function deleteTenant(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, null, "Tenant deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete tenant");
  }
}

export async function getTenantBranding(req: Request, res: Response) {
  try {
    const { subdomain } = req.params;
    const tenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() }).select("name logoUrl themeConfig");
    
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    return sendSuccess(res, {
      name: tenant.name,
      logoUrl: tenant.logoUrl || null,
      primaryColor: tenant.themeConfig?.primaryColor || "#1C2434"
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch tenant branding");
  }
}

export async function updateTenantSettings(req: AuthRequest, res: Response) {
  try {
    if (!req.user || !req.user.roles.includes("municipality_admin")) {
      return sendError(res, 403, "Forbidden: Only Municipality Admins can update settings");
    }

    const { logoUrl, primaryColor, name } = req.body;
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (primaryColor !== undefined) updateData["themeConfig.primaryColor"] = primaryColor;
    if (name !== undefined) updateData.name = name;

    const tenant = await Tenant.findByIdAndUpdate(
      req.user.municipalityId || req.user.tenantId,
      { $set: updateData },
      { new: true }
    );

    return sendSuccess(res, tenant, "Tenant settings updated successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to update tenant settings");
  }
}

// Phase 10: SaaS Tenant Signup
export async function signupTenant(req: Request, res: Response) {
  try {
    const { name, subdomain, code, ownerName, ownerEmail, password, planName = "starter" } = req.body;
    
    // 1. Check if tenant exists
    if (await Tenant.findOne({ $or: [{ code }, { subdomain }] })) {
      return sendError(res, 400, "Tenant with this code or subdomain already exists");
    }

    // 2. Create Tenant
    const tenant = await Tenant.create({
      name,
      subdomain,
      code,
      type: "studio",
      status: "approved",
      isActive: true
    });
    
    const tenantId = tenant._id.toString(); // For consistent ID reference

    // 3. Setup Trial Subscription
    let plan = await SubscriptionPlan.findOne({ name: planName });
    if (!plan) {
      plan = await SubscriptionPlan.create({
        name: planName as any,
        priceMonthly: planName === "starter" ? 49 : 99,
        includedFeatures: planName === "starter" ? ["core", "billing"] : ["core", "billing", "academy", "ai"],
        maxBranches: 1,
        maxStaff: 5
      });
    }

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 14); // 14 day trial

    await TenantSubscription.create({
      tenantId,
      planId: plan._id,
      status: "trial",
      billingProvider: "none",
      currentPeriodEnd
    });

    // 4. Create Main Branch
    const branch = await Branch.create({
      tenantId,
      name: "Main Branch",
      code: "MAIN",
      type: "headquarters",
      isMainBranch: true,
      status: "active"
    });

    // 5. Create Owner Person & User
    const nameParts = ownerName.split(" ");
    const person = await Person.create({
      tenantId,
      type: "staff",
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" ") || "Admin",
      contactEmails: [ownerEmail]
    });

    const user = await User.create({
      tenantId: tenantId as any,
      personId: person._id,
      username: ownerEmail,
      email: ownerEmail,
      password, // Should be hashed in pre-save middleware
      isActive: true
    });

    // 6. Assign Role
    let adminRole = await Role.findOne({ name: "tenant_admin", tenantId });
    if (!adminRole) {
      adminRole = await Role.create({ name: "tenant_admin", tenantId, permissions: ["all"] });
    }

    await RoleAssignment.create({
      tenantId,
      userId: user._id,
      roleId: adminRole._id
    });

    return sendSuccess(res, { tenant, user: { id: user._id, username: user.username } }, 201);
  } catch (error: any) {
    console.error(error);
    return sendError(res, 500, "Failed to create tenant: " + error.message);
  }
}

// Phase 10: Impersonation
export async function impersonateTenant(req: AuthRequest, res: Response) {
  try {
    const { tenantId, reason } = req.body;
    
    // Must be platform admin
    if (!req.user || !req.user.roles.includes("platform_admin")) {
      return sendError(res, 403, "Only Platform Admins can impersonate");
    }

    // Find the primary admin for this tenant
    const role = await Role.findOne({ name: "tenant_admin", tenantId });
    if (!role) return sendError(res, 404, "Tenant admin role not found");
    
    const roleAssignment = await RoleAssignment.findOne({ tenantId, roleId: role._id });
    if (!roleAssignment) return sendError(res, 404, "No admin user found for tenant");
    
    const targetUser = await User.findById(roleAssignment.userId);
    if (!targetUser) return sendError(res, 404, "Target user not found");

    // Log impersonation
    await ImpersonationLog.create({
      supportPersonId: req.user.id as any,
      tenantId,
      reason
    });

    // Generate token for target user
    const token = jwt.sign(
      { 
        id: targetUser._id, 
        tenantId,
        roles: ["tenant_admin"],
        isImpersonated: true,
        originalUserId: req.user.id
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    return sendSuccess(res, { token, user: { id: targetUser._id, username: targetUser.username } }, "Impersonation started");
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to impersonate");
  }
}
