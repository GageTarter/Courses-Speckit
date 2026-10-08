import { Router } from "express";
import sectionController from "../controllers/section.controller.js";
import { authenticate, requireAdmin } from "../authorization/authorization.js";

const router = Router();
const adminOnly = [authenticate, requireAdmin];

router.get("/", adminOnly, sectionController.findAll);
router.post("/", adminOnly, sectionController.create);
router.put("/:sectionId", adminOnly, sectionController.update);
router.delete("/:sectionId", adminOnly, sectionController.remove);

export default router;
