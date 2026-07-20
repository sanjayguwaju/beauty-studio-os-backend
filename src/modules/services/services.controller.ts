import { Response } from "express";
import { AuthRequest } from "../../types";
import { ServiceCatalog } from "../../models/ServiceCatalog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";

export async function listServices(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search, category, branchId } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId || req.user!.municipalityId,
  };

  if (branchId) {
    filter.branchId = branchId;
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    ServiceCatalog.find(filter).skip((page - 1) * pageSize).limit(pageSize),
    ServiceCatalog.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createService(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("create", "ServiceCatalog")) {
    return sendError(res, 403, "Forbidden: Cannot create services");
  }

  const { priceSolo, priceSupervised } = req.body;
  if (priceSupervised && priceSupervised > priceSolo) {
    return sendError(res, 400, "Supervised price cannot be greater than solo price");
  }

  const service = await ServiceCatalog.create({
    ...req.body,
    tenantId: req.user!.tenantId || req.user!.municipalityId,
  });

  return sendSuccess(res, service, "Service created", 201);
}

export async function getService(req: AuthRequest, res: Response) {
  const service = await ServiceCatalog.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId || req.user!.municipalityId,
  });

  if (!service) return sendError(res, 404, "Service not found");

  const tagged = tag("ServiceCatalog", service.toObject());
  if (req.ability!.cannot("read", subject("ServiceCatalog", tagged))) {
    return sendError(res, 403, "Forbidden");
  }

  return sendSuccess(res, service);
}

export async function updateService(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "ServiceCatalog")) {
    return sendError(res, 403, "Forbidden: Cannot update services");
  }

  const { priceSolo, priceSupervised } = req.body;
  if (priceSupervised && priceSupervised > priceSolo) {
    return sendError(res, 400, "Supervised price cannot be greater than solo price");
  }

  const service = await ServiceCatalog.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId || req.user!.municipalityId },
    { $set: req.body },
    { new: true }
  );

  if (!service) return sendError(res, 404, "Service not found");

  return sendSuccess(res, service, "Service updated");
}

export async function deleteService(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("delete", "ServiceCatalog")) {
    return sendError(res, 403, "Forbidden: Cannot delete services");
  }

  const service = await ServiceCatalog.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user!.tenantId || req.user!.municipalityId,
  });

  if (!service) return sendError(res, 404, "Service not found");

  return sendSuccess(res, null, "Service deleted");
}
