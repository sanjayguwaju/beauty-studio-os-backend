import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { getCachedPermissionsForRoles, getCachedUserSession, getCachedPersonSession } from "../modules/auth/auth.service";
import { buildAbility } from "../casl/ability.factory";
import { AuthRequest, AccessTokenPayload, AuthUser } from "../types";
import { sendError } from "../utils/response";
import { tenantContext } from "../utils/tenantContext";

/** Verify JWT and attach user + CASL ability to request */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.accessToken ??
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) return sendError(res, 401, "Not authenticated");

    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

    // Try Person first (StudioOS)
    let personSession = await getCachedPersonSession(payload.sub);
    let userSession = null;
    
    if (!personSession) {
      // Fallback to Palata User
      userSession = await getCachedUserSession(payload.sub);
      if (!userSession || !userSession.isActive) return sendError(res, 401, "User not found or inactive");
    } else if (!personSession.person.isActive) {
      return sendError(res, 401, "Person is inactive");
    }

    let rolesSlugs: string[] = [];
    let authUser: AuthUser;

    if (personSession) {
      const { person, roleAssignments } = personSession;
      // Gather unique roles from active assignments
      rolesSlugs = Array.from(new Set(roleAssignments.map((ra: any) => ra.role)));
      
      authUser = {
        id: person._id.toString(),
        email: person.email,
        phone: person.phone,
        name: person.fullName,
        tenantId: person.tenantId?.toString() || "",
        roles: rolesSlugs as any,
        roleAssignments: roleAssignments.map((ra: any) => ({
          tenantId: ra.tenantId.toString(),
          branchId: ra.branchId?.toString(),
          role: ra.role
        }))
      };
    } else if (userSession) {
      rolesSlugs = userSession.rolesSlugs;
      authUser = {
        id: userSession._id.toString(),
        email: userSession.email,
        name: userSession.name,
        tenantId: userSession.tenantId.toString(),
        branchId: userSession.branchId?.toString(),
        roles: rolesSlugs as any,
      };
    } else {
      return sendError(res, 401, "Auth subject not found");
    }

    const permissions = await getCachedPermissionsForRoles(rolesSlugs);

    req.user = authUser;
    req.ability = buildAbility(req.user, permissions);
    
    const contextId = authUser.tenantId || authUser.tenantId;
    return tenantContext.run({ tenantId: contextId }, () => {
      next();
    });
  } catch (err) {
    return sendError(res, 401, "Invalid or expired token");
  }
}

/** Optional auth — attaches user if token present, continues regardless */
export async function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken ?? req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    
    let personSession = await getCachedPersonSession(payload.sub);
    let userSession = null;
    if (!personSession) {
      userSession = await getCachedUserSession(payload.sub);
    }

    let rolesSlugs: string[] = [];
    let authUser: AuthUser | undefined;

    if (personSession && personSession.person.isActive) {
      const { person, roleAssignments } = personSession;
      rolesSlugs = Array.from(new Set(roleAssignments.map((ra: any) => ra.role)));
      authUser = {
        id: person._id.toString(),
        email: person.email,
        phone: person.phone,
        name: person.fullName,
        tenantId: person.tenantId?.toString() || "",
        roles: rolesSlugs as any,
        roleAssignments: roleAssignments.map((ra: any) => ({
          tenantId: ra.tenantId.toString(),
          branchId: ra.branchId?.toString(),
          role: ra.role
        }))
      };
    } else if (userSession && userSession.isActive) {
      rolesSlugs = userSession.rolesSlugs;
      authUser = {
        id: userSession._id.toString(),
        email: userSession.email,
        name: userSession.name,
        tenantId: userSession.tenantId.toString(),
        branchId: userSession.branchId?.toString(),
        roles: rolesSlugs as any,
      };
    }

    if (authUser) {
      const permissions = await getCachedPermissionsForRoles(rolesSlugs);
      req.user = authUser;
      req.ability = buildAbility(req.user, permissions);
      const contextId = authUser.tenantId || authUser.tenantId;
      return tenantContext.run({ tenantId: contextId }, () => {
        next();
      });
    }
  } catch {}
  next();
}
