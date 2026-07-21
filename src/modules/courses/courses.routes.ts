import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./courses.controller";

const router = Router();

router.use(authenticate);

// Courses
router.get("/", controller.listCourses);
router.post("/", controller.createCourse);
router.get("/:id", controller.getCourse);
router.put("/:id", controller.updateCourse);
router.delete("/:id", controller.deleteCourse);

// Modules
router.post("/modules", controller.createModule);
router.delete("/modules/:moduleId", controller.deleteModule);

// Curriculum Items
router.post("/items", controller.createCurriculumItem);
router.delete("/items/:itemId", controller.deleteCurriculumItem);

export default router;
