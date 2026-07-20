import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { BudgetAllocation } from "../../models/BudgetAllocation";
import { RevenueCollection } from "../../models/RevenueCollection";
import { LedgerEntry } from "../../models/LedgerEntry";
import { sendSuccess, sendError } from "../../utils/response";
import { createApproval } from "../approvals/approval.service";
import { Types } from "mongoose";

// ─── Budget Allocations ────────────────────────────────────────────────────────

export async function createBudgetAllocation(req: AuthRequest, res: Response) {
  const { municipalityId } = req.user!;
  const { fiscalYear, sectionSlug, wardId, allocatedAmountNpr } = req.body;

  try {
    const allocation = await BudgetAllocation.create({
      municipalityId,
      fiscalYear,
      sectionSlug,
      wardId,
      allocatedAmountNpr,
      status: "draft",
    });

    // Send to approval engine
    const approval = await createApproval(
      municipalityId,
      "budget_allocation",
      "BudgetAllocation",
      allocation._id as Types.ObjectId,
      req.user!.roles.includes("platform_admin") ? 0 : 3, // simplified creator level
      allocatedAmountNpr
    );

    allocation.approvalId = approval._id as Types.ObjectId;
    await allocation.save();

    return sendSuccess(res, allocation, "Budget allocation created and sent for approval");
  } catch (error: any) {
    if (error.code === 11000) {
      return sendError(res, 400, "Budget allocation for this section and ward already exists for the fiscal year");
    }
    return sendError(res, 500, "Failed to create budget allocation", [error.message]);
  }
}

export async function getBudgetAllocations(req: AuthRequest, res: Response) {
  const { municipalityId } = req.user!;
  const filter: any = { municipalityId };
  if (req.query.fiscalYear) filter.fiscalYear = req.query.fiscalYear;
  if (req.query.sectionSlug) filter.sectionSlug = req.query.sectionSlug;

  try {
    const allocations = await BudgetAllocation.find(filter)
      .populate("approvalId", "status currentLevelRequired")
      .sort({ createdAt: -1 });
    return sendSuccess(res, allocations);
  } catch (error: any) {
    return sendError(res, 500, "Failed to fetch budget allocations", [error.message]);
  }
}

export async function getBudgetAllocationSummary(req: AuthRequest, res: Response) {
  const { municipalityId } = req.user!;
  const { id } = req.params;

  try {
    const allocation = await BudgetAllocation.findOne({ _id: id, municipalityId });
    if (!allocation) return sendError(res, 404, "Budget allocation not found");

    const remaining = allocation.allocatedAmountNpr - allocation.spentAmountNpr;
    return sendSuccess(res, {
      ...allocation.toJSON(),
      remainingAmountNpr: remaining,
    });
  } catch (error: any) {
    return sendError(res, 500, "Failed to fetch budget summary", [error.message]);
  }
}

// ─── Revenue Collections ───────────────────────────────────────────────────────

export async function createRevenueCollection(req: AuthRequest, res: Response) {
  const { municipalityId, id: userId } = req.user!;
  const { wardId, revenueType, payerName, payerPhone, amountNpr, receiptNumber, receiptUrl, dateBs } = req.body;

  try {
    const revenue = await RevenueCollection.create({
      municipalityId,
      wardId,
      revenueType,
      payerName,
      payerPhone,
      amountNpr,
      receiptNumber,
      receiptUrl,
      dateBs,
      collectedBy: userId,
    });

    // Auto-create LedgerEntry
    await LedgerEntry.create({
      municipalityId,
      wardId,
      type: "income",
      amountNpr,
      sourceModule: "finance",
      sourceRecordId: revenue._id,
      description: `Revenue: ${revenueType.replace("_", " ")} - ${payerName} (Receipt: ${receiptNumber})`,
      dateBs,
    });

    return sendSuccess(res, revenue, "Revenue collected successfully");
  } catch (error: any) {
    if (error.code === 11000) {
      return sendError(res, 400, "Receipt number already exists");
    }
    return sendError(res, 500, "Failed to create revenue collection", [error.message]);
  }
}

export async function getRevenueCollections(req: AuthRequest, res: Response) {
  const { municipalityId } = req.user!;
  const filter: any = { municipalityId };
  if (req.query.wardId) filter.wardId = req.query.wardId;
  if (req.query.revenueType) filter.revenueType = req.query.revenueType;

  try {
    const revenues = await RevenueCollection.find(filter)
      .populate("collectedBy", "name")
      .sort({ createdAt: -1 });
    return sendSuccess(res, revenues);
  } catch (error: any) {
    return sendError(res, 500, "Failed to fetch revenue collections", [error.message]);
  }
}
