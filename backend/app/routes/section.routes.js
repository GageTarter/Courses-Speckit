import { Router } from "express";
import sectionController from "../controllers/section.controller.js";

const router = Router();

router.get("/", sectionController.findAll);
router.post("/", sectionController.create);
router.put("/:sectionId", sectionController.update);
router.delete("/:sectionId", sectionController.remove);

export default router;