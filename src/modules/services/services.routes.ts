import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./services.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.listServices));
router.post("/", asyncHandler(controller.createService));
router.get("/:id", asyncHandler(controller.getService));
router.put("/:id", asyncHandler(controller.updateService));
router.delete("/:id", asyncHandler(controller.deleteService));

export default router;
