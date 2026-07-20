import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listServiceRequests, createServiceRequest, createSRValidation,
  getServiceRequest, trackByNumber, updateStatus, assignServiceRequest,
  updateServiceRequest, deleteServiceRequest
} from "./service-requests.controller";

const router = Router();

// Public track endpoint (no auth needed)
router.get("/track/:trackingNumber", trackByNumber);

router.use(authenticate);
router.get("/", authorize("read", "ServiceRequest"), listServiceRequests);
router.post("/", authorize("create", "ServiceRequest"), createSRValidation, validate, createServiceRequest);
router.get("/:id", authorize("read", "ServiceRequest"), getServiceRequest);
router.put("/:id", authorize("update", "ServiceRequest"), updateServiceRequest);
router.delete("/:id", authorize("delete", "ServiceRequest"), deleteServiceRequest);
router.patch("/:id/status", authorize("update", "ServiceRequest"), updateStatus);
router.patch("/:id/assign", authorize("approve", "ServiceRequest"), assignServiceRequest);

export default router;
