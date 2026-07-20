import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { Citizen } from "../../models/Citizen";
import { ServiceRequest } from "../../models/ServiceRequest";
import { Complaint } from "../../models/Complaint";
import { BirthRegistration } from "../../models/Registration";
import { sendSuccess, sendError } from "../../utils/response";
import { BudgetAllocation } from "../../models/BudgetAllocation";
import { RevenueCollection } from "../../models/RevenueCollection";
import { InfraProject } from "../../models/InfraProject";
import { DisasterIncident } from "../../models/DisasterIncident";
import { ReliefApplication } from "../../models/ReliefApplication";
import { HealthPost } from "../../models/HealthPost";
import { School } from "../../models/School";
import { LivestockRecord } from "../../models/LivestockRecord";
import Redis from "ioredis";

// We won't strictly enforce a running Redis server if it's not configured;
// this fails gracefully in caching logic.
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on('error', (err) => {
  // Ignore connection errors during local dev if Redis isn't running
  // The getCachedData handles the fallback gracefully
});

// Helper to get or set cache
async function getCachedData(cacheKey: string, fetcher: () => Promise<any>, ttlSeconds = 300) {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const data = await fetcher();
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
    return data;
  } catch (error) {
    // Fallback to fetcher if Redis fails or isn't running
    return await fetcher();
  }
}

export async function getOverviewDashboard(req: AuthRequest, res: Response) {
  const mId = req.user!.municipalityId;
  const cacheKey = `dashboard:${mId}:overview:all`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [totalCitizens, pendingRequests, openComplaints, recentBirths, requestsByStatus] =
        await Promise.all([
          Citizen.countDocuments({ municipalityId: mId, isDeleted: false }),
          ServiceRequest.countDocuments({ municipalityId: mId, status: "submitted" }),
          Complaint.countDocuments({ municipalityId: mId, status: "received" }),
          BirthRegistration.countDocuments({ municipalityId: mId, createdAt: { $gte: thirtyDaysAgo } }),
          ServiceRequest.aggregate([
            { $match: { municipalityId: mId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ]),
        ]);

      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const [monthlyComplaints, monthlyServiceRequests] = await Promise.all([
        Complaint.aggregate([
          { $match: { municipalityId: mId, createdAt: { $gte: yearAgo } } },
          { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
          { $sort: { "_id": 1 } },
        ]),
        ServiceRequest.aggregate([
          { $match: { municipalityId: mId, createdAt: { $gte: yearAgo } } },
          { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
          { $sort: { "_id": 1 } },
        ]),
      ]);

      const processMonthly = (data: any[]) => {
        const result = Array(12).fill(0);
        data.forEach((item) => {
          result[item._id - 1] = item.count;
        });
        return result;
      };

      const budget = await BudgetAllocation.aggregate([
        { $match: { municipalityId: mId } },
        { $group: { _id: null, totalAllocated: { $sum: "$allocatedAmountNpr" }, totalSpent: { $sum: "$spentAmountNpr" } } }
      ]);
      const revenue = await RevenueCollection.aggregate([
        { $match: { municipalityId: mId } },
        { $group: { _id: null, totalCollected: { $sum: "$amountNpr" } } }
      ]);

      return {
        citizens: { total: totalCitizens },
        serviceRequests: {
          pending: pendingRequests,
          byStatus: Object.fromEntries(requestsByStatus.map((r: any) => [r._id, r.count])),
          monthly: processMonthly(monthlyServiceRequests),
        },
        complaints: { 
          open: openComplaints,
          monthly: processMonthly(monthlyComplaints),
        },
        registrations: { birthsLast30Days: recentBirths },
        budget: budget[0] || { totalAllocated: 0, totalSpent: 0 },
        revenue: revenue[0] || { totalCollected: 0 },
        generatedAt: new Date().toISOString(),
      };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load overview dashboard", [error.message]);
  }
}

export async function getFinanceDashboard(req: AuthRequest, res: Response) {
  const { municipalityId, wardId } = req.user!;
  const scope = wardId ? wardId.toString() : "all";
  const cacheKey = `dashboard:${municipalityId}:finance:${scope}`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const match = wardId ? { municipalityId, wardId } : { municipalityId };
      const budgetBySection = await BudgetAllocation.aggregate([
        { $match: match },
        { $group: { _id: "$sectionSlug", allocated: { $sum: "$allocatedAmountNpr" }, spent: { $sum: "$spentAmountNpr" } } }
      ]);
      const revenueByType = await RevenueCollection.aggregate([
        { $match: match },
        { $group: { _id: "$revenueType", total: { $sum: "$amountNpr" } } }
      ]);
      return { budgetBySection, revenueByType };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load finance dashboard", [error.message]);
  }
}

export async function getInfrastructureDashboard(req: AuthRequest, res: Response) {
  const { municipalityId, wardId } = req.user!;
  const scope = wardId ? wardId.toString() : "all";
  const cacheKey = `dashboard:${municipalityId}:infrastructure:${scope}`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const match = wardId ? { municipalityId, wardId } : { municipalityId };
      const projectStatus = await InfraProject.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      const avgCompletion = await InfraProject.aggregate([
        { $match: match },
        { $group: { _id: null, avgPercent: { $avg: "$percentComplete" } } }
      ]);
      return { projectStatus, avgCompletion: avgCompletion[0]?.avgPercent || 0 };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load infrastructure dashboard", [error.message]);
  }
}

export async function getHealthDashboard(req: AuthRequest, res: Response) {
  const { municipalityId, wardId } = req.user!;
  const scope = wardId ? wardId.toString() : "all";
  const cacheKey = `dashboard:${municipalityId}:health:${scope}`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const match = wardId ? { municipalityId, wardId } : { municipalityId };
      const totalPosts = await HealthPost.countDocuments(match);
      return { totalPosts }; // Expandable in the future
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load health dashboard", [error.message]);
  }
}

export async function getEducationDashboard(req: AuthRequest, res: Response) {
  const { municipalityId, wardId } = req.user!;
  const scope = wardId ? wardId.toString() : "all";
  const cacheKey = `dashboard:${municipalityId}:education:${scope}`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const match = wardId ? { municipalityId, wardId } : { municipalityId };
      const schoolsByType = await School.aggregate([
        { $match: match },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]);
      return { schoolsByType }; // Expandable
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load education dashboard", [error.message]);
  }
}

export async function getAgricultureDashboard(req: AuthRequest, res: Response) {
  const { municipalityId, wardId } = req.user!;
  const scope = wardId ? wardId.toString() : "all";
  const cacheKey = `dashboard:${municipalityId}:agriculture:${scope}`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const match = wardId ? { municipalityId, wardId } : { municipalityId };
      const livestockByType = await LivestockRecord.aggregate([
        { $match: match },
        { $group: { _id: "$animalType", totalCount: { $sum: "$count" } } }
      ]);
      return { livestockByType }; // Expandable
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load agriculture dashboard", [error.message]);
  }
}

export async function getDisasterDashboard(req: AuthRequest, res: Response) {
  const { municipalityId, wardId } = req.user!;
  const scope = wardId ? wardId.toString() : "all";
  const cacheKey = `dashboard:${municipalityId}:disaster_management:${scope}`;

  try {
    const data = await getCachedData(cacheKey, async () => {
      const match = wardId ? { municipalityId, wardId } : { municipalityId };
      const incidentsBySeverity = await DisasterIncident.aggregate([
        { $match: match },
        { $group: { _id: "$severity", count: { $sum: 1 } } }
      ]);
      const reliefStatus = await ReliefApplication.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$requestedAmountNpr" } } }
      ]);
      return { incidentsBySeverity, reliefStatus };
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, 500, "Failed to load disaster dashboard", [error.message]);
  }
}
