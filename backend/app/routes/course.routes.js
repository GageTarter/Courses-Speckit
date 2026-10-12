import { Router } from "express";
import courseController from "../controllers/course.controller.js";
import { authenticate, requireAdmin } from "../authorization/authorization.js";

const router = Router();
const adminOnly = [authenticate, requireAdmin];

router.get("/", [authenticate], courseController.findAll);
router.post("/", adminOnly, courseController.create);
router.put("/:id", adminOnly, courseController.update);
router.delete("/:id", adminOnly, courseController.remove);

export default router;
