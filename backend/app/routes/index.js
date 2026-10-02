import { Router } from "express";
import courseRoutes from "./course.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();
router.use("/courses", courseRoutes);
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);

export default router;
