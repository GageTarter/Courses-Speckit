import { Router } from "express";
import semesterController from "../controllers/semester.controller.js";
import { authenticate, requireAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], semesterController.findAll);
router.post("/", [authenticate, requireAdmin], semesterController.create);
router.put("/:id", [authenticate, requireAdmin], semesterController.update);
router.delete("/:id", [authenticate, requireAdmin], semesterController.remove);

export default router;
