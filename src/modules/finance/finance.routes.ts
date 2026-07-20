import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import {
  createBudgetAllocation,
  getBudgetAllocations,
  getBudgetAllocationSummary,
  createRevenueCollection,
  getRevenueCollections,
} from "./finance.controller";

const budgetRouter = Router();
const revenueRouter = Router();

// Budget Allocations
budgetRouter.use(authenticate);
budgetRouter.post("/", authorize("create", "BudgetAllocation"), createBudgetAllocation);
budgetRouter.get("/", authorize("read", "BudgetAllocation"), getBudgetAllocations);
budgetRouter.get("/:id/summary", authorize("read", "BudgetAllocation"), getBudgetAllocationSummary);

// Revenue Collections
revenueRouter.use(authenticate);
revenueRouter.post("/", authorize("create", "RevenueCollection"), createRevenueCollection);
revenueRouter.get("/", authorize("read", "RevenueCollection"), getRevenueCollections);

export { budgetRouter, revenueRouter };
