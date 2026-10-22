import { Router } from "express";
import catalog from "../controllers/catalog.controller.js";
import enrollments from "../controllers/enrollment.controller.js";
import myCourses from "../controllers/myCourse.controller.js";
import mySections from "../controllers/mySection.controller.js";
import { authenticate, requireStudent } from "../authorization/authorization.js";

const router = Router();

router.get("/semesters", [authenticate], catalog.findAllSemesters);
// Avoid clashing with admin Feature 5 CRUD at GET /sections
router.get("/catalog/sections", [authenticate], catalog.findAllSections);

router.get("/my-courses", [authenticate, requireStudent], myCourses.findMine);
router.get("/my-sections", [authenticate, requireStudent], mySections.findMine);
router.get("/enrollments", [authenticate], enrollments.findAll);
router.post("/enrollments", [authenticate, requireStudent], enrollments.create);
router.delete("/enrollments/:id", [authenticate, requireStudent], enrollments.remove);

export default router;
