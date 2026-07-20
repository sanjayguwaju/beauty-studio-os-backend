import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./certifications.controller";

const router = Router();

router.use(authenticate);

router.get("/requirements", asyncHandler(controller.listRequirements));
router.post("/requirements", asyncHandler(controller.createRequirement));

router.get("/status/:courseId/:studentPersonId", asyncHandler(controller.getStudentStatus));
router.post("/status/:statusId/override", asyncHandler(controller.overrideStatus));

router.post("/issue", asyncHandler(controller.issueCertificate));

export default router;
