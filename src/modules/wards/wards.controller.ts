import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Ward } from "../../models/Ward";
import { sendSuccess, sendError } from "../../utils/response";

export const wardValidation = [
  body("wardNumber").isInt({ min: 1, max: 50 }),
];

export async function listWards(req: AuthRequest, res: Response) {
  const wards = await Ward.find({ municipalityId: req.user!.municipalityId, isActive: true }).sort("wardNumber");
  return sendSuccess(res, wards);
}

export async function createWard(req: AuthRequest, res: Response) {
  const ward = await Ward.create({ ...req.body, municipalityId: req.user!.municipalityId });
  return sendSuccess(res, ward, "Ward created", 201);
}

export async function getWard(req: AuthRequest, res: Response) {
  const ward = await Ward.findOne({ _id: req.params.id, municipalityId: req.user!.municipalityId });
  if (!ward) return sendError(res, 404, "Ward not found");
  return sendSuccess(res, ward);
}

export async function updateWard(req: AuthRequest, res: Response) {
  const ward = await Ward.findOneAndUpdate(
    { _id: req.params.id, municipalityId: req.user!.municipalityId },
    { $set: req.body }, { new: true },
  );
  if (!ward) return sendError(res, 404, "Ward not found");
  return sendSuccess(res, ward, "Ward updated");
}
