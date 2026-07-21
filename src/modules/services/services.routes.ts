import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./services.controller";

const router = Router();

router.use(authenticate);

router.get("/", controller.listServices);
router.post("/", controller.createService);
router.get("/:id", controller.getService);
router.put("/:id", controller.updateService);
router.delete("/:id", controller.deleteService);

export default router;
