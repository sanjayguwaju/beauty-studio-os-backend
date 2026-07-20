import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./products.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.listProducts));
router.post("/", asyncHandler(controller.createProduct));
router.put("/:id", asyncHandler(controller.updateProduct));
router.post("/:id/stock", asyncHandler(controller.addStock));

export default router;
