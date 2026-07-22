import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { sendError } from "../utils/response";
import { TenantSubscription } from "../models/TenantSubscription";
import { SubscriptionPlan } from "../models/SubscriptionPlan";

export const requireFeature = (feature: "academy" | "ai" | "billing") => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 401, "Unauthorized");
      }

      // If it's the platform admin impersonating or super admin, maybe bypass? 
      // For now let's enforce based on tenant id to see what they see.

      const sub = await TenantSubscription.findOne({ tenantId }).populate("planId");
      if (!sub) {
        return sendError(res, 403, "No active subscription found");
      }

      const plan = sub.planId as any;
      if (!plan || !plan.includedFeatures || !plan.includedFeatures.includes(feature)) {
        return sendError(res, 403, `This feature requires an upgraded subscription plan. Feature '${feature}' not included.`);
      }

      next();
    } catch (error) {
      console.error(error);
      return sendError(res, 500, "Failed to verify subscription feature");
    }
  };
};
