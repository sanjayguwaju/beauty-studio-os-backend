import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./courses.controller";

const router = Router();

router.use(authenticate);

// Courses
router.get("/", asyncHandler(controller.listCourses));
router.post("/", asyncHandler(controller.createCourse));
router.get("/:id", asyncHandler(controller.getCourse));
router.put("/:id", asyncHandler(controller.updateCourse));
router.delete("/:id", asyncHandler(controller.deleteCourse));

// Modules
router.post("/modules", asyncHandler(controller.createModule));
router.delete("/modules/:moduleId", asyncHandler(controller.deleteModule));

// Curriculum Items
router.post("/items", asyncHandler(controller.createCurriculumItem));
router.delete("/items/:itemId", asyncHandler(controller.deleteCurriculumItem));

export default router;
