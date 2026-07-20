import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listCitizens, createCitizen, citizenValidation, getCitizen, updateCitizen, deleteCitizen, approveCitizen } from "./citizens.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Citizen"), listCitizens);
router.post("/", authorize("create", "Citizen"), citizenValidation, validate, createCitizen);
router.get("/:id", authorize("read", "Citizen"), getCitizen);
router.put("/:id", authorize("update", "Citizen"), updateCitizen);
router.delete("/:id", authorize("delete", "Citizen"), deleteCitizen);
router.patch("/:id/approve", authorize("approve", "Citizen"), approveCitizen);

export default router;
