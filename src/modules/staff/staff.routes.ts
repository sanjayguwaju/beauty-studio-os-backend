import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./staff.controller";

const router = Router();

router.use(authenticate);

router.get("/", controller.listStaff);
router.post("/", controller.createStaff);
router.get("/:id", controller.getStaff);
router.put("/:id", controller.updateStaff);

export default router;
