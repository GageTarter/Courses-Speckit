import { Router } from "express";
import courseController from "../controllers/course.controller.js";

const router = Router();

//router.get("/", [authenticateRoute], courseController.findAll);
//router.post("/", [authenticateRoute, requireAdmin], courseController.create);
//router.put("/:id", [authenticateRoute, requireAdmin], courseController.update);
//router.delete("/:id", [authenticateRoute, requireAdmin], courseController.remove);

router.get("/", courseController.findAll);
router.post("/", courseController.create);
router.put("/:id", courseController.update);
router.delete("/:id", courseController.remove);
export default router;
