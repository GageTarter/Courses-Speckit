/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md
 */
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { authenticate, requireAdmin } from "../app/authorization/authorization.js";
import {
  syncTestDatabase,
  closeTestDatabase,
  registerUser,
  login,
  seedAdmin,
} from "./helpers.js";

/**
 * Minimal app exercising the real guards. Feature 1 ships no admin-only
 * product route yet, so the guards are mounted here instead.
 */
const probeApp = express();
probeApp.use(express.json());
probeApp.get("/probe", [authenticate], (req, res) =>
  res.send({ userId: req.user.id, role: req.user.role })
);
probeApp.get("/admin-probe", [authenticate, requireAdmin], (_req, res) =>
  res.send({ allowed: true })
);

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

describe("Feature 1 — Request guards", () => {
  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const { body } = await registerUser();

      const res = await request(probeApp)
        .get("/probe")
        .set("Authorization", `Bearer ${body.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ userId: body.userId, role: "student" });
    });

    it("Expired or invalid session token", async () => {
      const { body } = await registerUser();

      const garbage = await request(probeApp)
        .get("/probe")
        .set("Authorization", "Bearer not-a-real-token");

      expect(garbage.status).toBe(401);

      // Valid signature, but the stored session has already lapsed.
      const stillSignedToken = jwt.sign({ id: body.userId }, authConfig.secret, {
        expiresIn: 86400,
      });
      await db.session.update(
        { token: stillSignedToken, expirationDate: new Date(Date.now() - 1000) },
        { where: { userId: body.userId } }
      );

      const expired = await request(probeApp)
        .get("/probe")
        .set("Authorization", `Bearer ${stillSignedToken}`);

      expect(expired.status).toBe(401);
      expect(expired.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Protected API request without a token", async () => {
      const res = await request(probeApp).get("/probe");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized! No token provided.");
    });
  });

  describe("US-1.6 — Distinguish admins from students", () => {
    it("Student is rejected by the admin guard", async () => {
      const { body } = await registerUser();

      const res = await request(probeApp)
        .get("/admin-probe")
        .set("Authorization", `Bearer ${body.token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Forbidden! Admin access required.");
    });

    it("Admin passes the admin guard", async () => {
      const admin = await seedAdmin();
      const { body } = await login(admin.username, admin.password);

      const res = await request(probeApp)
        .get("/admin-probe")
        .set("Authorization", `Bearer ${body.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ allowed: true });
    });
  });
});
