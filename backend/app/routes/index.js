import { Router } from "express";
import authRoutes from "./auth.routes.js";
import sectionRoutes from "./section.routes.js";
import courseRoutes from "./course.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);
router.use("/courses", courseRoutes);
router.use("/sections", sectionRoutes);

export default router;
