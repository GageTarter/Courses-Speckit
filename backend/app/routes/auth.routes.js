import { Router } from "express";
import controller from "../controllers/auth.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", [authenticate], controller.logout);

export default router;
