import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { listDocuments, uploadDocument } from "./documents.controller";

const router = Router();
router.use(authenticate);
router.get("/", authorize("read", "Document"), listDocuments);
router.post("/upload", authorize("create", "Document"), uploadDocument);

export default router;
