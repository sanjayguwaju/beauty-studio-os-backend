import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./staff.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.listStaff));
router.post("/", asyncHandler(controller.createStaff));
router.get("/:id", asyncHandler(controller.getStaff));
router.put("/:id", asyncHandler(controller.updateStaff));

export default router;
