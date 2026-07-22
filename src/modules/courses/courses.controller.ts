import { Response } from "express";
import { AuthRequest } from "../../types";
import { Course } from "../../models/Course";
import { CourseModule } from "../../models/CourseModule";
import { CurriculumItem } from "../../models/CurriculumItem";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { tag } from "../../casl/ability.factory";
import { subject } from "@casl/ability";

// --- Course ---

export async function listCourses(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "20"), 100);
  const { search } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId || req.user!.tenantId,
  };

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const [data, total] = await Promise.all([
    Course.find(filter).skip((page - 1) * pageSize).limit(pageSize),
    Course.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createCourse(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("create", "Course")) {
    return sendError(res, 403, "Forbidden");
  }

  const course = await Course.create({
    ...req.body,
    tenantId: req.user!.tenantId || req.user!.tenantId,
  });

  return sendSuccess(res, course, "Course created", 201);
}

export async function getCourse(req: AuthRequest, res: Response) {
  const course = await Course.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId || req.user!.tenantId,
  });

  if (!course) return sendError(res, 404, "Course not found");

  const tagged = tag("Course", course.toObject());
  if (req.ability!.cannot("read", subject("Course", tagged))) {
    return sendError(res, 403, "Forbidden");
  }

  // Also fetch modules and curriculum items
  const modules = await CourseModule.find({ courseId: course._id }).sort({ sequenceOrder: 1 }).lean();
  const moduleIds = modules.map(m => m._id);
  const items = await CurriculumItem.find({ moduleId: { $in: moduleIds } }).lean();

  const modulesWithItems = modules.map(m => ({
    ...m,
    items: items.filter(i => i.moduleId.toString() === m._id.toString())
  }));

  return sendSuccess(res, { ...course.toObject(), modules: modulesWithItems });
}

export async function updateCourse(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Course")) {
    return sendError(res, 403, "Forbidden");
  }

  const course = await Course.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId || req.user!.tenantId },
    { $set: req.body },
    { new: true }
  );

  if (!course) return sendError(res, 404, "Course not found");

  return sendSuccess(res, course, "Course updated");
}

export async function deleteCourse(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("delete", "Course")) {
    return sendError(res, 403, "Forbidden");
  }

  const course = await Course.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user!.tenantId || req.user!.tenantId,
  });

  if (!course) return sendError(res, 404, "Course not found");

  // Cascade delete logic can be added here or in pre-remove hook
  const modules = await CourseModule.find({ courseId: course._id });
  const moduleIds = modules.map(m => m._id);
  await CurriculumItem.deleteMany({ moduleId: { $in: moduleIds } });
  await CourseModule.deleteMany({ courseId: course._id });

  return sendSuccess(res, null, "Course deleted");
}

// --- Modules ---

export async function createModule(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Course")) {
    return sendError(res, 403, "Forbidden");
  }
  const { courseId, name, sequenceOrder } = req.body;
  const course = await Course.findOne({ _id: courseId, tenantId: req.user!.tenantId || req.user!.tenantId });
  if (!course) return sendError(res, 404, "Course not found");

  const mod = await CourseModule.create({ courseId, name, sequenceOrder });
  return sendSuccess(res, mod, "Module created", 201);
}

export async function deleteModule(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Course")) {
    return sendError(res, 403, "Forbidden");
  }
  const mod = await CourseModule.findOneAndDelete({ _id: req.params.moduleId });
  if (!mod) return sendError(res, 404, "Module not found");

  await CurriculumItem.deleteMany({ moduleId: mod._id });
  return sendSuccess(res, null, "Module deleted");
}

// --- Curriculum Items ---

export async function createCurriculumItem(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Course")) {
    return sendError(res, 403, "Forbidden");
  }
  const { moduleId, name, description, requiresSupervisedCount } = req.body;
  const mod = await CourseModule.findById(moduleId);
  if (!mod) return sendError(res, 404, "Module not found");

  const item = await CurriculumItem.create({ moduleId, name, description, requiresSupervisedCount });
  return sendSuccess(res, item, "Curriculum item created", 201);
}

export async function deleteCurriculumItem(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Course")) {
    return sendError(res, 403, "Forbidden");
  }
  const item = await CurriculumItem.findOneAndDelete({ _id: req.params.itemId });
  if (!item) return sendError(res, 404, "Curriculum item not found");
  return sendSuccess(res, null, "Curriculum item deleted");
}
