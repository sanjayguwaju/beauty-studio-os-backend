import { Router } from "express";
import { trackStatus } from "./citizen-portal.controller";

const router = Router();

// Completely public route, but requires subdomain context via middleware or headers
router.get("/track", trackStatus);

export default router;
