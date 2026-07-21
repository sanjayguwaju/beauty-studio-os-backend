import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./products.controller";

const router = Router();

router.use(authenticate);

router.get("/", controller.listProducts);
router.post("/", controller.createProduct);
router.put("/:id", controller.updateProduct);
router.post("/:id/stock", controller.addStock);

export default router;
