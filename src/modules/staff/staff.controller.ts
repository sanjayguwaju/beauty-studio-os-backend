import { Response } from "express";
import { AuthRequest } from "../../types";
import { StaffProfile } from "../../models/StaffProfile";
import { Person } from "../../models/Person";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";

export async function listStaff(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search, branchId } = req.query;

  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const personQuery: Record<string, unknown> = { tenantId };

  if (search) {
    personQuery.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const matchingPersons = await Person.find(personQuery, "_id");
  const personIds = matchingPersons.map(p => p._id);

  const filter: Record<string, unknown> = {
    tenantId,
    personId: { $in: personIds }
  };

  if (branchId) {
    filter.branchId = branchId;
  }

  const [data, total] = await Promise.all([
    StaffProfile.find(filter)
      .populate("personId", "fullName phone email image")
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    StaffProfile.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function getStaff(req: AuthRequest, res: Response) {
  const staff = await StaffProfile.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId || req.user!.municipalityId,
  }).populate("personId", "fullName phone email image");

  if (!staff) return sendError(res, 404, "Staff profile not found");

  const tagged = tag("StaffProfile", staff.toObject());
  if (req.ability!.cannot("read", subject("StaffProfile", tagged))) {
    // A stylist can read their own profile, which is usually checked by ID, but for now we rely on CASL if we have specific rules.
    // Assuming 'read' is allowed for all staff in the same tenant.
    return sendError(res, 403, "Forbidden");
  }

  return sendSuccess(res, staff);
}

export async function updateStaff(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("manage", "StaffProfile") && req.ability!.cannot("update", "StaffProfile")) {
    return sendError(res, 403, "Forbidden: Cannot update staff profiles");
  }

  const { specialties, workingHours, branchId } = req.body;
  const tenantId = req.user!.tenantId || req.user!.municipalityId;

  const updatedStaff = await StaffProfile.findByIdAndUpdate(
    req.params.id,
    { $set: { specialties, workingHours, branchId } },
    { new: true }
  ).populate("personId", "fullName phone email image");

  if (!updatedStaff) return sendError(res, 404, "Staff profile not found");

  return sendSuccess(res, updatedStaff, "Staff profile updated");
}

export async function createStaff(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("manage", "StaffProfile") && req.ability!.cannot("create", "StaffProfile")) {
    return sendError(res, 403, "Forbidden: Cannot create staff profiles");
  }

  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { personId, branchId, specialties, workingHours } = req.body;

  const existingProfile = await StaffProfile.findOne({ personId, tenantId });
  if (existingProfile) {
    return sendError(res, 400, "Staff profile already exists for this person");
  }

  const staff = await StaffProfile.create({
    personId,
    tenantId,
    branchId,
    specialties,
    workingHours
  });

  const populated = await staff.populate("personId", "fullName phone email image");
  return sendSuccess(res, populated, "Staff profile created", 201);
}
