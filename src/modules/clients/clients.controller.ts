import { Response } from "express";
import { AuthRequest } from "../../types";
import { ClientProfile } from "../../models/ClientProfile";
import { Person } from "../../models/Person";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";

export async function listClients(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search } = req.query;

  const tenantId = req.user!.tenantId || req.user!.municipalityId;

  // Since ClientProfile uses Person for name/phone, we need to join or search Persons first
  const personQuery: Record<string, unknown> = { tenantId };

  if (search) {
    personQuery.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // Find matching persons
  const matchingPersons = await Person.find(personQuery, "_id");
  const personIds = matchingPersons.map(p => p._id);

  const filter = {
    tenantId,
    personId: { $in: personIds }
  };

  const [data, total] = await Promise.all([
    ClientProfile.find(filter)
      .populate("personId", "fullName phone email image")
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    ClientProfile.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createClient(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("create", "ClientProfile")) {
    return sendError(res, 403, "Forbidden: Cannot create clients");
  }

  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { fullName, phone, email, preferences, allergyNotes, patchTestOnFile, patchTestDate } = req.body;

  // 1. Create or find Person
  let person = null;
  if (phone) {
    person = await Person.findOne({ phone, tenantId });
  } else if (email) {
    person = await Person.findOne({ email, tenantId });
  }

  if (!person) {
    person = await Person.create({
      fullName,
      phone,
      email,
      tenantId,
      authProvider: "otp" // clients default to OTP
    });
  }

  // 2. Create ClientProfile
  const existingProfile = await ClientProfile.findOne({ personId: person._id, tenantId });
  if (existingProfile) {
    return sendError(res, 400, "Client profile already exists for this person");
  }

  const client = await ClientProfile.create({
    personId: person._id,
    tenantId,
    preferences,
    allergyNotes,
    patchTestOnFile,
    patchTestDate
  });

  const populated = await client.populate("personId", "fullName phone email image");
  return sendSuccess(res, populated, "Client created", 201);
}

export async function getClient(req: AuthRequest, res: Response) {
  const client = await ClientProfile.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId || req.user!.municipalityId,
  }).populate("personId", "fullName phone email image");

  if (!client) return sendError(res, 404, "Client not found");

  const tagged = tag("ClientProfile", client.toObject());
  if (req.ability!.cannot("read", subject("ClientProfile", tagged))) {
    return sendError(res, 403, "Forbidden");
  }

  return sendSuccess(res, client);
}

export async function updateClient(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "ClientProfile")) {
    return sendError(res, 403, "Forbidden: Cannot update clients");
  }

  const { fullName, phone, email, preferences, allergyNotes, patchTestOnFile, patchTestDate } = req.body;
  const tenantId = req.user!.tenantId || req.user!.municipalityId;

  const client = await ClientProfile.findOne({ _id: req.params.id, tenantId });
  if (!client) return sendError(res, 404, "Client not found");

  // Update person details
  if (fullName || phone || email) {
    await Person.findByIdAndUpdate(client.personId, {
      $set: { fullName, phone, email }
    });
  }

  // Update profile
  const updatedClient = await ClientProfile.findByIdAndUpdate(
    req.params.id,
    { $set: { preferences, allergyNotes, patchTestOnFile, patchTestDate } },
    { new: true }
  ).populate("personId", "fullName phone email image");

  return sendSuccess(res, updatedClient, "Client updated");
}

export async function deleteClient(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("delete", "ClientProfile")) {
    return sendError(res, 403, "Forbidden: Cannot delete clients");
  }

  const client = await ClientProfile.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user!.tenantId || req.user!.municipalityId,
  });

  if (!client) return sendError(res, 404, "Client not found");

  return sendSuccess(res, null, "Client deleted");
}
