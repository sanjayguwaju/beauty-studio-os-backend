import { Response } from "express";
import { AuthRequest } from "../../types";
import { AiRecommendation } from "../../models/AiRecommendation";
import { OcrExtraction } from "../../models/OcrExtraction";
import { Person } from "../../models/Person";
import { ServiceCatalog } from "../../models/ServiceCatalog";
import { sendSuccess, sendError } from "../../utils/response";

// --- Recommendations ---

export async function generateRecommendations(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { personId } = req.params;

  // Mock AI Generation Logic
  // We'll see if there's an existing service catalog item to recommend.
  const services = await ServiceCatalog.find({ tenantId }).limit(1).lean();
  const serviceId = services.length > 0 ? services[0]._id : null;

  const recommendation = await AiRecommendation.create({
    tenantId,
    clientPersonId: personId,
    type: "complementary_service",
    recommendedServiceId: serviceId,
    reasoning: "Based on your recent visit history, we think you would love this complementary service.",
  });

  return sendSuccess(res, recommendation, "Recommendation created", 201);
}

export async function getRecommendations(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { personId } = req.params;

  const recommendations = await AiRecommendation.find({
    tenantId,
    clientPersonId: personId,
    dismissed: false,
  }).populate("recommendedServiceId");

  return sendSuccess(res, recommendations);
}

export async function dismissRecommendation(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { id } = req.params;

  const recommendation = await AiRecommendation.findOneAndUpdate(
    { _id: id, tenantId },
    { dismissed: true },
    { new: true }
  );

  if (!recommendation) {
    return sendError(res, 404, "Recommendation not found");
  }

  return sendSuccess(res, recommendation);
}

// --- OCR Document Intake ---

export async function processOcr(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { sourceDocumentUrl } = req.body;

  if (!sourceDocumentUrl) {
    return sendError(res, 400, "sourceDocumentUrl is required");
  }

  // Mock Vision API extraction
  const mockExtractedFields = {
    name: "Jane Doe (Extracted)",
    dob: "1995-05-15",
    idNumber: "ID-" + Math.floor(Math.random() * 100000),
  };

  const extraction = await OcrExtraction.create({
    tenantId,
    sourceDocumentUrl,
    extractedFields: mockExtractedFields,
    confidenceScore: 0.92,
    status: "pending"
  });

  return sendSuccess(res, extraction, "OCR extraction processed", 201);
}

export async function getPendingOcr(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  
  const extractions = await OcrExtraction.find({ tenantId, status: "pending" }).sort({ createdAt: -1 });
  return sendSuccess(res, extractions);
}

export async function approveOcr(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { id } = req.params;
  const { finalFields } = req.body; // Allows staff to correct fields during approval

  const extraction = await OcrExtraction.findOne({ _id: id, tenantId, status: "pending" });
  if (!extraction) {
    return sendError(res, 404, "Pending OCR extraction not found");
  }

  const fieldsToUse = finalFields || extraction.extractedFields;

  // Create the actual Person record
  const person = await Person.create({
    tenantId,
    type: "student",
    firstName: fieldsToUse.name?.split(' ')[0] || "Unknown",
    lastName: fieldsToUse.name?.split(' ').slice(1).join(' ') || "Unknown",
    dob: fieldsToUse.dob ? new Date(fieldsToUse.dob) : undefined,
    contactNumbers: [fieldsToUse.idNumber || ""], // Storing ID in contactNumbers temporarily for MVP if needed, or custom metadata
    metadata: {
      idNumber: fieldsToUse.idNumber,
      ocrSourceId: extraction._id
    }
  });

  // Mark extraction as approved
  extraction.status = "approved";
  extraction.reviewedByPersonId = req.user!.id as any;
  extraction.reviewedAt = new Date();
  await extraction.save();

  return sendSuccess(res, { extraction, person });
}
