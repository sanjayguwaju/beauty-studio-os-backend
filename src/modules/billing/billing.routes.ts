import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./billing.controller";

const router = Router();

router.use(authenticate);

router.get("/invoices", asyncHandler(controller.listInvoices));
router.post("/invoices/course-fee", asyncHandler(controller.createCourseFeeInvoice));

router.get("/commissions", asyncHandler(controller.listCommissions));
router.post("/commissions/:id/pay", asyncHandler(controller.markCommissionPaid));

export default router;
