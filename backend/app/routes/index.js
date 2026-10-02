import { Router } from "express";
import sectionRoutes from "./section.routes.js";
import courseRoutes from "./course.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/courses", courseRoutes);
router.use("/sectionapi/sections", sectionRoutes);

export default router;
