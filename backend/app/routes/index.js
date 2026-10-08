import { Router } from "express";
import authRoutes from "./auth.routes.js";
import facultyRoutes from "./faculty.routes.js";
import enrollmentRoutes from "./enrollment.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);
router.use("/facultyapi/faculties", facultyRoutes);
router.use("/", enrollmentRoutes);

export default router;