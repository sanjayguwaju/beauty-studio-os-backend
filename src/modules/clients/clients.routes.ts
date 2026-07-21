import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./clients.controller";

const router = Router();

router.use(authenticate);

router.get("/", controller.listClients);
router.post("/", controller.createClient);
router.get("/:id", controller.getClient);
router.put("/:id", controller.updateClient);
router.delete("/:id", controller.deleteClient);

export default router;
