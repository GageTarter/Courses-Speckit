import { Router } from "express";
import facultyController from "../controllers/faculty.controller.js";
import { authenticate, requireAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], facultyController.findAll);
router.post("/", [authenticate, requireAdmin], facultyController.create);
router.put("/:id", [authenticate, requireAdmin], facultyController.update);
router.delete("/:id", [authenticate, requireAdmin], facultyController.remove);

export default router;
