import { Router } from "express";
import catalog from "../controllers/catalog.controller.js";
import enrollments from "../controllers/enrollment.controller.js";
import { authenticate, requireStudent } from "../authorization/authorization.js";

const router = Router();

router.get("/semesters", [authenticate], catalog.findAllSemesters);
router.get("/sections", [authenticate], catalog.findAllSections);

router.get("/enrollments", [authenticate], enrollments.findAll);
router.post("/enrollments", [authenticate, requireStudent], enrollments.create);
router.delete("/enrollments/:id", [authenticate, requireStudent], enrollments.remove);

export default router;
