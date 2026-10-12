/**
 * Feature 5 — Section Management
 * Spec: features/feature-5-section-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { seedAdmin, login, registerUser } from "./helpers.js";

const validSection = {
  sectionNumber: 1,
  semesterId: 1,
  courseId: 1,
  facultyId: 1,
  daysOfWeek: ["Monday", "Wednesday"],
  startTime: "11:40",
  endTime: "12:50",
};

let adminToken;
let facultyId;

async function createSection(overrides = {}) {
  return request(app)
    .post("/courses/sections")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ ...validSection, facultyId, ...overrides });
}

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
  const admin = await seedAdmin();
  const signedIn = await login(admin.username, admin.password);
  adminToken = signedIn.body.token;
});

afterAll(async () => {
  await db.sequelize.close();
});

beforeEach(async () => {
  await db.section.destroy({ where: {} });
  await db.faculty.destroy({ where: {} });
  await db.semester.destroy({ where: {} });
  await db.semester.bulkCreate([
    {
      id: 1,
      name: "Fall",
      startDate: "2026-08-15",
      endDate: "2026-12-15",
    },
    {
      id: 2,
      name: "Spring",
      startDate: "2027-01-10",
      endDate: "2027-05-10",
    },
    {
      id: 3,
      name: "Summer",
      startDate: "2027-05-20",
      endDate: "2027-08-10",
    },
    {
      id: 4,
      name: "Winter",
      startDate: "2026-12-16",
      endDate: "2027-01-09",
    },
  ]);
  const faculty = await db.faculty.create({
    firstName: "Ada",
    lastName: "Lovelace",
    dept: "Computer Science",
  });
  facultyId = faculty.id;
});

describe("Feature 5 — Section Management", () => {
  describe("US-5.1 — Create a Section", () => {
    it("An unsigned request cannot access sections", async () => {
      const response = await request(app).get("/courses/sections");

      expect(response.status).toBe(401);
    });

    it("A signed-in student cannot access sections", async () => {
      const student = await registerUser({
        username: "student1",
        email: "student1@example.com",
      });
      const response = await request(app)
        .get("/courses/sections")
        .set("Authorization", `Bearer ${student.body.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Forbidden! Admin access required.",
      });
    });

    it("Start time equal to end time returns 400", async () => {
      const response = await createSection({
        startTime: "11:40",
        endTime: "11:40",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "startTime must be earlier than endTime.",
      });
    });

    it("Start time later than end time returns 400", async () => {
      const response = await createSection({
        startTime: "12:50",
        endTime: "11:40",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "startTime must be earlier than endTime.",
      });
    });

    it("Section number 0 or 100 returns 400", async () => {
      const zero = await createSection({ sectionNumber: 0 });
      const tooHigh = await createSection({ sectionNumber: 100 });

      expect(zero.status).toBe(400);
      expect(zero.body).toEqual({
        message: "sectionNumber must be an integer from 1 to 99.",
      });
      expect(tooHigh.status).toBe(400);
      expect(tooHigh.body).toEqual({
        message: "sectionNumber must be an integer from 1 to 99.",
      });
    });

    it("Unknown semester id returns 404", async () => {
      const response = await createSection({ semesterId: 9 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Cannot find semester with id=9.",
      });
    });

    it("Unknown faculty id returns 404", async () => {
      const response = await createSection({ facultyId: 999 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Cannot find faculty with id=999.",
      });
    });

    it("A section number can be reused for a different course or semester", async () => {
      const first = await createSection({ courseId: 1, semesterId: 1 });
      const otherCourse = await createSection({ courseId: 2, semesterId: 1 });
      const otherSemester = await createSection({ courseId: 1, semesterId: 2 });

      expect(first.status).toBe(201);
      expect(otherCourse.status).toBe(201);
      expect(otherSemester.status).toBe(201);
      expect(otherCourse.body.courseId).toBe(2);
      expect(otherSemester.body.semesterId).toBe(2);
    });

    it("A Feature 3 semester id is stored on the section", async () => {
      const response = await createSection({ semesterId: 4 });

      expect(response.status).toBe(201);
      expect(response.body.semesterId).toBe(4);
    });
  });

  describe("US-5.3 — Update a section's details", () => {
    it("Update with a non-numeric id returns 400", async () => {
      const response = await request(app)
        .put("/courses/sections/abc")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validSection, facultyId });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Invalid section id." });
    });

    it("Update a section id that does not exist returns 404", async () => {
      const response = await request(app)
        .put("/courses/sections/999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...validSection, facultyId });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Cannot find section with id=999.",
      });
    });
  });

  describe("US-5.4 — Delete a Section", () => {
    it("Delete with a non-numeric id returns 400", async () => {
      const response = await request(app)
        .delete("/courses/sections/abc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Invalid section id." });
    });

    it("Delete a section id that does not exist returns 404", async () => {
      const response = await request(app)
        .delete("/courses/sections/999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Cannot find section with id=999.",
      });
    });
  });
});
