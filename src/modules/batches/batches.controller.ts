import { Response } from "express";
import { AuthRequest } from "../../types";
import { Batch } from "../../models/Batch";
import { Enrollment } from "../../models/Enrollment";
import { Person } from "../../models/Person";
import { RoleAssignment } from "../../models/RoleAssignment";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";

// --- Batches ---

export async function listBatches(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search, courseId } = req.query;

  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const filter: Record<string, unknown> = { tenantId };

  if (courseId) {
    filter.courseId = courseId;
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const [data, total] = await Promise.all([
    Batch.find(filter)
      .populate("courseId", "name category durationWeeks")
      .populate("instructorPersonId", "fullName email")
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Batch.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createBatch(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("create", "Batch")) {
    return sendError(res, 403, "Forbidden");
  }

  const batch = await Batch.create({
    ...req.body,
    tenantId: req.user!.tenantId || req.user!.tenantId,
  });

  return sendSuccess(res, batch, "Batch created", 201);
}

export async function getBatch(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const batch = await Batch.findOne({ _id: req.params.id, tenantId })
    .populate("courseId", "name category")
    .populate("instructorPersonId", "fullName email");

  if (!batch) return sendError(res, 404, "Batch not found");

  const tagged = tag("Batch", batch.toObject());
  if (req.ability!.cannot("read", subject("Batch", tagged))) {
    return sendError(res, 403, "Forbidden");
  }

  // Also get enrollments
  const enrollments = await Enrollment.find({ batchId: batch._id })
    .populate("studentPersonId", "fullName email phone")
    .lean();

  return sendSuccess(res, { ...batch.toObject(), enrollments });
}

export async function updateBatch(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Batch")) {
    return sendError(res, 403, "Forbidden");
  }

  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const batch = await Batch.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { $set: req.body },
    { new: true }
  );

  if (!batch) return sendError(res, 404, "Batch not found");
  return sendSuccess(res, batch, "Batch updated");
}

export async function deleteBatch(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("delete", "Batch")) {
    return sendError(res, 403, "Forbidden");
  }

  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const batch = await Batch.findOneAndDelete({ _id: req.params.id, tenantId });
  if (!batch) return sendError(res, 404, "Batch not found");

  await Enrollment.deleteMany({ batchId: batch._id });

  return sendSuccess(res, null, "Batch deleted");
}

// --- Enrollments ---

export async function enrollStudent(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Batch")) {
    return sendError(res, 403, "Forbidden");
  }

  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const { batchId, studentPersonId } = req.body;

  const batch = await Batch.findOne({ _id: batchId, tenantId });
  if (!batch) return sendError(res, 404, "Batch not found");

  const person = await Person.findOne({ _id: studentPersonId, tenantId });
  if (!person) return sendError(res, 404, "Person not found");

  // Ensure they have 'student' role assignment
  const roleCheck = await RoleAssignment.findOne({
    personId: studentPersonId,
    tenantId,
    role: "student"
  });

  if (!roleCheck) {
    await RoleAssignment.create({
      personId: studentPersonId,
      tenantId,
      role: "student",
      status: "active"
    });
  }

  const exists = await Enrollment.findOne({ batchId, studentPersonId });
  if (exists) {
    return sendError(res, 400, "Student already enrolled in this batch");
  }

  const enrollment = await Enrollment.create({
    batchId,
    studentPersonId,
    tenantId,
    status: "active"
  });

  return sendSuccess(res, enrollment, "Student enrolled successfully", 201);
}

export async function updateEnrollmentStatus(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Batch")) {
    return sendError(res, 403, "Forbidden");
  }

  const { status } = req.body;
  const enrollment = await Enrollment.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { status } },
    { new: true }
  );

  if (!enrollment) return sendError(res, 404, "Enrollment not found");
  return sendSuccess(res, enrollment, "Enrollment updated");
}
