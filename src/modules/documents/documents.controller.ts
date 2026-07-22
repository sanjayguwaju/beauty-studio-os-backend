import { Response } from "express";
import { AuthRequest } from "../../types";
import { sendSuccess, sendError } from "../../utils/response";
// Placeholder — real implementation wires Multer + Cloudflare R2
// See docs/DOCUMENT_UPLOAD.md for R2 integration steps

export async function listDocuments(req: AuthRequest, res: Response) {
  return sendSuccess(res, [], "Document module ready — wire Multer + R2 for file handling");
}

export async function uploadDocument(req: AuthRequest, res: Response) {
  // 1. Multer parses multipart (configured in routes)
  // 2. Stream to R2 with municipality-scoped key: `{tenantId}/{entityType}/{entityId}/{filename}`
  // 3. Save metadata to a Document collection (add model as needed)
  return sendSuccess(res, { message: "Wire R2 upload here" }, "Upload endpoint ready", 201);
}
