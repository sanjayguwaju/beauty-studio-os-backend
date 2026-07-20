import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listWards, createWard, wardValidation, getWard, updateWard } from "./wards.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Ward"), listWards);
router.post("/", authorize("create", "Ward"), wardValidation, validate, createWard);
router.get("/:id", authorize("read", "Ward"), getWard);
router.put("/:id", authorize("update", "Ward"), updateWard);

export default router;
