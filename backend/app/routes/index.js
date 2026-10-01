import { Router } from "express";
import courseRoutes from "./course.routes.js";

const router = Router();
router.use("/courses", courseRoutes);
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Register feature routers here as you implement them, e.g.:
// import authRoutes from "./auth.routes.js";
// router.use("/", authRoutes);

export default router;
