import { Router } from "express";
import authRoutes from "./auth.routes.js";
import sectionRoutes from "./section.routes.js";
import courseRoutes from "./course.routes.js";
import enrollmentRoutes from "./enrollment.routes.js";
import semesterRoutes from "./semester.routes.js";

const router = Router();
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);
router.use("/", enrollmentRoutes);
router.use("/courses", courseRoutes);
router.use("/sections", sectionRoutes);
router.use("/semesters", semesterRoutes);

export default router;
