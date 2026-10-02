import { Router } from "express";
import courseController from "../controllers/course.controller.js";
import { authenticate, requireAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], courseController.findAll);
router.post("/", [authenticate, requireAdmin], courseController.create);
router.put("/:id", [authenticate, requireAdmin], courseController.update);
router.delete("/:id", [authenticate, requireAdmin], courseController.remove);

//router.get("/", courseController.findAll);
//router.post("/", courseController.create);
//router.put("/:id", courseController.update);
//router.delete("/:id", courseController.remove);
export default router;
