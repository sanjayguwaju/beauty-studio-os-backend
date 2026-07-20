import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./clients.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(controller.listClients));
router.post("/", asyncHandler(controller.createClient));
router.get("/:id", asyncHandler(controller.getClient));
router.put("/:id", asyncHandler(controller.updateClient));
router.delete("/:id", asyncHandler(controller.deleteClient));

export default router;
