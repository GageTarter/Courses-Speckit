/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md
 *
 * Shared request guards. Controllers call these instead of re-checking
 * tokens or roles inline.
 */
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const bearerTokenFrom = (req) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
};

export const authenticate = async (req, res, next) => {
  const token = bearerTokenFrom(req);

  if (!token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  try {
    jwt.verify(token, authConfig.secret);
  } catch {
    return res.status(401).send({ message: "Unauthorized! Invalid token." });
  }

  const session = await db.session.findOne({
    where: { token },
    include: [{ model: db.user }],
  });

  if (!session || !session.user) {
    return res.status(401).send({ message: "Unauthorized! Invalid token." });
  }

  if (new Date(session.expirationDate).getTime() < Date.now()) {
    return res.status(401).send({ message: "Unauthorized! Session expired." });
  }

  req.user = { id: session.user.id, role: session.user.role };
  req.session = session;

  return next();
};

export const requireStudent = (req, res, next) => {
  if (req.user?.role !== "student") {
    logger.warn(`Student route refused for user id=${req.user?.id}`);
    return res.status(403).send({ message: "Forbidden! Student access required." });
  }

  return next();
};

export const getOwnedEnrollmentOrNull = async (req, enrollmentId) => {
  const row = await db.enrollment.findOne({
    where: { id: enrollmentId, userId: req.user.id },
  });

  return row ?? null;
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    logger.warn(`Admin route refused for user id=${req.user?.id}`);
    return res.status(403).send({ message: "Forbidden! Admin access required." });
  }

  return next();
};
