import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./certifications.controller";

const router = Router();

router.use(authenticate);

router.get("/requirements", controller.listRequirements);
router.post("/requirements", controller.createRequirement);

router.get("/status/:courseId/:studentPersonId", controller.getStudentStatus);
router.post("/status/:statusId/override", controller.overrideStatus);

router.post("/issue", controller.issueCertificate);

export default router;
