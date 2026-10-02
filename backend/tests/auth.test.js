/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  closeTestDatabase,
  validRegistration,
  registerUser,
  login,
  seedAdmin,
} from "./helpers.js";

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

describe("Feature 1 — Authentication API", () => {
  describe("US-1.1 — Register as a student", () => {
    it("Student registers with valid information", async () => {
      const res = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        username: "jdoe",
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "student",
      });
      expect(res.body.userId).toEqual(expect.any(Number));
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findOne({ where: { username: "jdoe" } });
      expect(stored.password).not.toBe("secret123");
      expect(await bcrypt.compare("secret123", stored.password)).toBe(true);
    });

    it("Registration ignores a role supplied in the request body", async () => {
      const res = await request(app)
        .post("/api/register")
        .send({ ...validRegistration({ username: "sneaky" }), role: "admin" });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe("student");

      const stored = await db.user.findOne({ where: { username: "sneaky" } });
      expect(stored.role).toBe("student");
    });

    it("User submits registration with missing email", async () => {
      const res = await registerUser({ email: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is required.");
      expect(await db.user.count()).toBe(0);
    });

    it("User submits registration with password too short", async () => {
      const res = await registerUser({ password: "short1" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Password must be at least 8 characters.");
      expect(await db.user.count()).toBe(0);
    });

    it("User registers with a duplicate username", async () => {
      await registerUser();

      // Different email, same username in different casing.
      const res = await registerUser({
        username: "JDoe",
        email: "other@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is already taken.");
      expect(await db.user.count()).toBe(1);
    });

    it("User registers with a duplicate email", async () => {
      await registerUser();

      const res = await registerUser({ username: "someoneelse" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is already registered.");
      expect(await db.user.count()).toBe(1);
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await registerUser();

      const res = await login("jdoe", "secret123");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ username: "jdoe", role: "student" });
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();

      const sessions = await db.session.findAll({ where: { email: "jane@example.com" } });
      expect(sessions.length).toBeGreaterThanOrEqual(1);
    });

    it("User signs in with invalid password", async () => {
      await registerUser();

      const res = await login("jdoe", "wrongpassword");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid username or password.");
      expect(res.body.token).toBeUndefined();
    });

    it("Unknown username returns the same error as a wrong password", async () => {
      await registerUser();

      const unknown = await login("ghost", "anypassword");
      const wrongPassword = await login("jdoe", "wrongpassword");

      expect(unknown.status).toBe(401);
      // Identical response, so the API never reveals which accounts exist.
      expect(unknown.body.message).toBe(wrongPassword.body.message);
    });

    it("Username is case-insensitive at sign in", async () => {
      await registerUser();

      const res = await login("JDoe", "secret123");

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("jdoe");
    });

    it("User signs in with missing username", async () => {
      const res = await login("", "secret123");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is required.");
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const { body } = await registerUser();

      const res = await request(app)
        .post("/api/logout")
        .set("Authorization", `Bearer ${body.token}`);

      expect(res.status).toBe(200);
      expect(await db.session.count({ where: { token: body.token } })).toBe(0);
    });

    it("Reusing a token after sign out fails", async () => {
      const { body } = await registerUser();

      await request(app)
        .post("/api/logout")
        .set("Authorization", `Bearer ${body.token}`);

      const replay = await request(app)
        .post("/api/logout")
        .set("Authorization", `Bearer ${body.token}`);

      expect(replay.status).toBe(401);
    });
  });

  describe("US-1.6 — Distinguish admins from students", () => {
    it("Seeded admin signs in and receives the admin role", async () => {
      const admin = await seedAdmin();

      const res = await login(admin.username, admin.password);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("admin");
    });
  });
});
