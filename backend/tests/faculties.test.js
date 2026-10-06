/**
 * Feature 4 — Faculty Management
 * Spec: features/feature-4-faculty-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  closeTestDatabase,
  seedAdmin,
  login,
  registerUser,
} from "./helpers.js";

const validFaculty = {
  firstName: "Ada",
  lastName: "Lovelace",
  dept: "Computer Science",
};

let adminToken;

async function createFaculty(overrides = {}, token = adminToken) {
  return request(app)
    .post("/courses/facultyapi/faculties")
    .set("Authorization", `Bearer ${token}`)
    .send({ ...validFaculty, ...overrides });
}

beforeAll(async () => {
  await syncTestDatabase();
}, 30000);

beforeEach(async () => {
  await db.faculty.destroy({ where: {} });
  await db.session.destroy({ where: {} });
  await db.user.destroy({ where: {} });
  const admin = await seedAdmin();
  const signedIn = await login(admin.username, admin.password);
  adminToken = signedIn.body.token;
}, 30000);

afterAll(async () => {
  await closeTestDatabase();
});

describe("Feature 4 — Faculty Management", () => {
  describe("US-4.1 — Add a faculty member", () => {
    it("Admin creates a new faculty member", async () => {
      const response = await createFaculty();

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        firstName: "Ada",
        lastName: "Lovelace",
        dept: "Computer Science",
      });
      expect(response.body.id).toEqual(expect.any(Number));
    });

    it("Non-admin cannot create a faculty member", async () => {
      const student = await registerUser({
        username: "student1",
        email: "student1@example.com",
      });

      const response = await createFaculty({}, student.body.token);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Forbidden! Admin access required.",
      });
      expect(await db.faculty.count()).toBe(0);
    });
  });

  describe("US-4.3 — Correct a faculty member's details", () => {
    it("Admin edits a faculty member's information", async () => {
      const created = await createFaculty();

      const response = await request(app)
        .put(`/courses/facultyapi/faculties/${created.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          firstName: "Grace",
          lastName: "Hopper",
          dept: "Mathematics",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Faculty was updated successfully.",
      });

      const listed = await request(app)
        .get("/courses/facultyapi/faculties")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(listed.body).toEqual([
        expect.objectContaining({
          id: created.body.id,
          firstName: "Grace",
          lastName: "Hopper",
          dept: "Mathematics",
        }),
      ]);
    });
  });

  describe("US-4.4 — Remove a faculty member", () => {
    it("Admin deletes a faculty member", async () => {
      const created = await createFaculty();

      const response = await request(app)
        .delete(`/courses/facultyapi/faculties/${created.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Faculty was deleted successfully.",
      });
      expect(await db.faculty.count()).toBe(0);
    });
  });
});
