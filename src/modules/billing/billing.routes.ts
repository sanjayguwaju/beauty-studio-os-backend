import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./billing.controller";

const router = Router();

router.use(authenticate);

router.get("/invoices", controller.listInvoices);
router.post("/invoices/course-fee", controller.createCourseFeeInvoice);
router.post("/pos-checkout", controller.posCheckout);
router.get("/invoices/:id/pdf", controller.downloadInvoicePdf);

router.get("/commissions", controller.listCommissions);
router.post("/commissions/:id/pay", controller.markCommissionPaid);

export default router;
