import { NextFunction, Response } from "express";
import { AuthRequest } from "../types";
import { FeatureFlag } from "../models/FeatureFlag";
import { sendError } from "../utils/response";

export const requireFeature = (featureKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const municipalityId = req.user?.municipalityId;
      const query: any = { key: featureKey };
      if (municipalityId) query.municipalityId = municipalityId;

      const flag = await FeatureFlag.findOne(query);
      
      // If the flag doesn't exist, we assume it's disabled or not ready
      if (!flag) {
        return sendError(res, 403, `Feature '${featureKey}' is not available.`);
      }

      // If it's globally disabled, block
      if (!flag.isActive) {
        return sendError(res, 403, `Feature '${featureKey}' is currently disabled.`);
      }

      // If it has specific wards enabled, and the user's ward is not in the list, block
      // Admin users might not have a wardId, so we let them bypass ward checks if needed, 
      // or we can strictly enforce it. Let's strictly enforce if enabledWards has entries and user is in a ward.
      if (flag.enabledWards.length > 0) {
        const userWardId = req.user?.wardId;
        if (userWardId) {
          const isEnabledForUserWard = flag.enabledWards.some((wardId) => wardId.toString() === userWardId.toString());
          if (!isEnabledForUserWard) {
            return sendError(res, 403, `Feature '${featureKey}' is not enabled for your ward.`);
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
