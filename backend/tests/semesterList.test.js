/**
 * Feature 3 — Semester Management
 * Spec: features/feature-3-semester-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  seedAdmin,
  login,
  authHeader,
  validSemester,
  createSemester,
  tokenForNewStudent,
} from "./helpers.js";

const adminToken = async () => {
    const admin = await seedAdmin();
    const loggedIn = await login(admin.username, admin.password);
    return loggedIn.body.token;
};

describe("Feature 3 — Semester Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.4 — Add a catalogue semester", () => {
    it("User creates a new semester", async () => {
      const token = await adminToken();
      const response = await createSemester(app, token);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "Fall 2026",
        startDate: "2026-08-01",
        endDate: "2026-12-31",
      });
      expect(response.body.id).toEqual(expect.any(Number));

      const stored = await db.semester.findOne({
        where: { name: "Fall 2026" },
      });
      expect(stored).not.toBeNull();
    });

    it("User creates a semester with a duplicate name", async () => {
      const token = await adminToken();
      await createSemester(app, token);

      const response = await createSemester(app, token);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Semester name is already taken.",
      });

      const count = await db.semester.count({
        where: { name: "Fall 2026" },
      });
      expect(count).toBe(1);
    });
  });

  describe("US-3.1 — Browse the semester list", () => {
    it("User views existing semesters", async () => {
      const token = await adminToken();
      await createSemester(app, token, { name: "Fall 2026" });
      await createSemester(app, token, {
        name: "Spring 2027",
        startDate: "2027-01-01",
        endDate: "2027-05-31",
      });

      const response = await request(app)
        .get("/courses/semesters")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.name)).toEqual([
        "Fall 2026",
        "Spring 2027",
      ]);
    });
  });

  describe("US-3.2 — Correct a semester's start date or end date", () => {
    it("User edits a semester's information", async () => {
      const token = await adminToken();
      const created = await createSemester(app, token);

      const response = await request(app)
        .put(`/courses/semesters/${created.body.id}`)
        .set(authHeader(token))
        .send({
          semesterId: created.body.id,
          name: "Spring 2027",
          startDate: "2027-01-01",
          endDate: "2027-05-31",
        });

      expect(response.status).toBe(200);

      const stored = await db.semester.findByPk(created.body.id);
      expect(stored.name).toBe("Spring 2027");
      expect(stored.startDate).toBe("2027-01-01");
      expect(stored.endDate).toBe("2027-05-31");
    });
  });

  describe("US-3.3 — Remove a semester", () => {
    it("User removes a semester", async () => {
      const token = await adminToken();
      const created = await createSemester(app, token);

      const response = await request(app)
        .delete(`/courses/semesters/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const stored = await db.semester.findByPk(created.body.id);
      expect(stored).toBeNull();
    });
  });
});
