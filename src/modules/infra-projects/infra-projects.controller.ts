import { Response } from "express";
import { body } from "express-validator";
import { Types } from "mongoose";
import { AuthRequest } from "../../types";
import { InfraProject } from "../../models/InfraProject";
import { InfraMilestone } from "../../models/InfraMilestone";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { createApproval } from "../approvals/approval.service";
import { Role } from "../../models/Role";

export const projectValidation = [
  body("name").notEmpty().trim(),
];

export const milestoneValidation = [
  body("description").notEmpty().trim(),
];

async function getActorLevel(user: AuthRequest["user"]): Promise<number> {
  const roles = await Role.find({ slug: { $in: user!.roles } }).select("level");
  return roles.length ? Math.min(...roles.map((r) => r.level)) : 5;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const filter: Record<string, unknown> = { municipalityId: req.user!.municipalityId, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.wardId) filter.wardId = req.query.wardId;

  const [data, total] = await Promise.all([
    InfraProject.find(filter).populate("wardId", "wardNumber").skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }),
    InfraProject.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createProject(req: AuthRequest, res: Response) {
  const project = await InfraProject.create({ ...req.body, municipalityId: req.user!.municipalityId });
  await AuditLog.create({ municipalityId: req.user!.municipalityId, actorId: req.user!.id, actorEmail: req.user!.email, module: "infrastructure", action: "CREATE", entityType: "InfraProject", entityId: project._id, entityLabel: project.name, after: project.toObject() });
  return sendSuccess(res, project, "Project created", 201);
}

export async function getProject(req: AuthRequest, res: Response) {
  const project = await InfraProject.findOne({ _id: req.params.id, municipalityId: req.user!.municipalityId, isDeleted: false }).populate("wardId", "wardNumber nameNp");
  if (!project) return sendError(res, 404, "Project not found");
  return sendSuccess(res, project);
}

export async function updateProject(req: AuthRequest, res: Response) {
  const before = await InfraProject.findOne({ _id: req.params.id, municipalityId: req.user!.municipalityId, isDeleted: false });
  if (!before) return sendError(res, 404, "Project not found");
  const project = await InfraProject.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  await AuditLog.create({ municipalityId: req.user!.municipalityId, actorId: req.user!.id, actorEmail: req.user!.email, module: "infrastructure", action: "UPDATE", entityType: "InfraProject", entityId: project!._id, entityLabel: project!.name, before: before.toObject(), after: project!.toObject() });
  return sendSuccess(res, project, "Project updated");
}

export async function deleteProject(req: AuthRequest, res: Response) {
  const project = await InfraProject.findOneAndUpdate({ _id: req.params.id, municipalityId: req.user!.municipalityId }, { isDeleted: true }, { new: true });
  if (!project) return sendError(res, 404, "Project not found");
  await AuditLog.create({ municipalityId: req.user!.municipalityId, actorId: req.user!.id, actorEmail: req.user!.email, module: "infrastructure", action: "DELETE", entityType: "InfraProject", entityId: project._id, entityLabel: project.name });
  return sendSuccess(res, null, "Project deleted");
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function listMilestones(req: AuthRequest, res: Response) {
  const project = await InfraProject.findOne({ _id: req.params.id, municipalityId: req.user!.municipalityId, isDeleted: false });
  if (!project) return sendError(res, 404, "Project not found");
  const milestones = await InfraMilestone.find({ projectId: req.params.id }).populate("approvalId").sort({ createdAt: 1 });
  return sendSuccess(res, milestones);
}

export async function createMilestone(req: AuthRequest, res: Response) {
  const project = await InfraProject.findOne({ _id: req.params.id, municipalityId: req.user!.municipalityId, isDeleted: false });
  if (!project) return sendError(res, 404, "Project not found");

  const milestone = await InfraMilestone.create({ ...req.body, projectId: req.params.id });

  // Create approval workflow for milestone sign-off
  const actorLevel = await getActorLevel(req.user);
  const approval = await createApproval(req.user!.municipalityId, "infrastructure", "InfraMilestone", milestone._id as Types.ObjectId, actorLevel);
  await InfraMilestone.findByIdAndUpdate(milestone._id, { approvalId: approval._id });

  await AuditLog.create({ municipalityId: req.user!.municipalityId, actorId: req.user!.id, actorEmail: req.user!.email, module: "infra_milestones", action: "CREATE", entityType: "InfraMilestone", entityId: milestone._id, entityLabel: milestone.description });
  return sendSuccess(res, { ...milestone.toObject(), approvalId: approval._id }, "Milestone created", 201);
}
