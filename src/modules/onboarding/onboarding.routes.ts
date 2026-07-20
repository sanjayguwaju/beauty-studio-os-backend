import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { registerMunicipality, registerMunicipalityValidation } from "./onboarding.controller";

const router = Router();

router.post("/register", registerMunicipalityValidation, validate, registerMunicipality);

export default router;
