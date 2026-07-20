import { Response } from "express";
import { body, query } from "express-validator";
import { AuthRequest } from "../../types";
import { Citizen } from "../../models/Citizen";
import { AuditLog } from "../../models/AuditLog";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const citizenValidation = [
  body("firstName").notEmpty().trim(),
  body("lastName").notEmpty().trim(),
  body("wardId").isMongoId(),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("dateOfBirthBs").optional().isString(),
];

export async function listCitizens(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search, wardId } = req.query;

  const filter: Record<string, unknown> = {
    municipalityId: req.user!.municipalityId,
    isDeleted: false,
  };

  // Ward officers are auto-scoped to their ward
  if (req.user!.roles.includes("ward_officer") && req.user!.wardId) {
    filter.wardId = req.user!.wardId;
  } else if (wardId) {
    filter.wardId = wardId;
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { citizenshipNumber: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    Citizen.find(filter).populate("wardId", "wardNumber").skip((page - 1) * pageSize).limit(pageSize),
    Citizen.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createCitizen(req: AuthRequest, res: Response) {
  const citizen = await Citizen.create({ ...req.body, municipalityId: req.user!.municipalityId });

  await AuditLog.create({
    municipalityId: req.user!.municipalityId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "citizens",
    action: "CREATE",
    entityType: "Citizen",
    entityId: citizen._id,
    entityLabel: `${citizen.firstName} ${citizen.lastName}`,
    after: citizen.toObject(),
  });

  return sendSuccess(res, citizen, "Citizen created", 201);
}

export async function getCitizen(req: AuthRequest, res: Response) {
  const citizen = await Citizen.findOne({
    _id: req.params.id,
    municipalityId: req.user!.municipalityId,
    isDeleted: false,
  }).populate("wardId", "wardNumber nameNp");
  if (!citizen) return sendError(res, 404, "Citizen not found");

  // CASL resource-level check with tag() helper (spread to avoid mutation)
  const tagged = tag("Citizen", citizen.toObject());
  if (req.ability!.cannot("read", subject("Citizen", tagged))) {
    return sendError(res, 403, "Forbidden");
  }

  return sendSuccess(res, citizen);
}

export async function updateCitizen(req: AuthRequest, res: Response) {
  const before = await Citizen.findOne({ _id: req.params.id, municipalityId: req.user!.municipalityId, isDeleted: false });
  if (!before) return sendError(res, 404, "Citizen not found");

  const citizen = await Citizen.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
  );

  await AuditLog.create({
    municipalityId: req.user!.municipalityId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "citizens",
    action: "UPDATE",
    entityType: "Citizen",
    entityId: citizen!._id,
    entityLabel: `${citizen!.firstName} ${citizen!.lastName}`,
    before: before.toObject(),
    after: citizen!.toObject(),
  });

  return sendSuccess(res, citizen, "Citizen updated");
}

export async function deleteCitizen(req: AuthRequest, res: Response) {
  const citizen = await Citizen.findOneAndUpdate(
    { _id: req.params.id, municipalityId: req.user!.municipalityId },
    { isDeleted: true },
    { new: true },
  );
  if (!citizen) return sendError(res, 404, "Citizen not found");

  await AuditLog.create({
    municipalityId: req.user!.municipalityId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "citizens",
    action: "DELETE",
    entityType: "Citizen",
    entityId: citizen._id,
    entityLabel: `${citizen.firstName} ${citizen.lastName}`,
  });

  return sendSuccess(res, null, "Citizen deleted");
}

export async function approveCitizen(req: AuthRequest, res: Response) {
  const { status } = req.body; // 'approved' or 'rejected'
  
  if (!["approved", "rejected"].includes(status)) {
    return sendError(res, 400, "Invalid status. Must be 'approved' or 'rejected'.");
  }

  const citizen = await Citizen.findOneAndUpdate(
    { _id: req.params.id, municipalityId: req.user!.municipalityId, isDeleted: false },
    { status, isVerified: status === "approved" },
    { new: true },
  );

  if (!citizen) return sendError(res, 404, "Citizen not found");

  await AuditLog.create({
    municipalityId: req.user!.municipalityId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "citizens",
    action: "APPROVE",
    entityType: "Citizen",
    entityId: citizen._id,
    entityLabel: `${citizen.firstName} ${citizen.lastName}`,
    description: `Citizen marked as ${status}`
  });

  return sendSuccess(res, citizen, `Citizen ${status}`);
}
