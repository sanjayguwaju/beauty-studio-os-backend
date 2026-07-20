import { Response } from "express";
import { AuthRequest } from "../../types";
import { Product } from "../../models/Product";
import { sendSuccess, sendError } from "../../utils/response";

export async function listProducts(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const products = await Product.find({ tenantId }).lean();
  return sendSuccess(res, products);
}

export async function createProduct(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const branchId = req.user!.branchId || req.body.branchId;

  const product = await Product.create({
    ...req.body,
    tenantId,
    branchId,
  });

  return sendSuccess(res, product, "Product created successfully", 201);
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { $set: req.body },
    { new: true }
  );

  if (!product) return sendError(res, 404, "Product not found");
  return sendSuccess(res, product, "Product updated");
}

export async function addStock(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { quantity } = req.body; // amount to add

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { $inc: { currentStock: quantity } },
    { new: true }
  );

  if (!product) return sendError(res, 404, "Product not found");
  return sendSuccess(res, product, "Stock added");
}
