/**
 * Feature 5 — Section Management
 * Spec: features/feature-5-section-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";

const validSection = {
  sectionNumber: 1,
  semesterId: 1,
  courseId: 1,
  facultyId: 1,
  daysOfWeek: ["Monday", "Wednesday"],
  startTime: "11:40",
  endTime: "12:50",
};

async function createSection(overrides = {}) {
  return request(app)
    .post("/api/sectionapi/sections")
    .send({ ...validSection, ...overrides });
}

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

beforeEach(async () => {
  await db.section.destroy({ where: {} });
});

describe("Feature 5 — Section Management", () => {
  describe("US-5.1 — Create a Section", () => {
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

    it("Semester id is not 1, 2, 3, or 4 returns 400", async () => {
      const response = await createSection({ semesterId: 9 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "semesterId must be Fall, Winter, Spring, or Summer.",
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

    it("Winter saves as semesterId 4", async () => {
      const response = await createSection({ semesterId: 4 });

      expect(response.status).toBe(201);
      expect(response.body.semesterId).toBe(4);
    });
  });

  describe("US-5.3 — Update a section's details", () => {
    it("Update with a non-numeric id returns 400", async () => {
      const response = await request(app)
        .put("/api/sectionapi/sections/abc")
        .send(validSection);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Invalid section id." });
    });

    it("Update a section id that does not exist returns 404", async () => {
      const response = await request(app)
        .put("/api/sectionapi/sections/999")
        .send(validSection);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Cannot find section with id=999.",
      });
    });
  });

  describe("US-5.4 — Delete a Section", () => {
    it("Delete with a non-numeric id returns 400", async () => {
      const response = await request(app).delete(
        "/api/sectionapi/sections/abc",
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Invalid section id." });
    });

    it("Delete a section id that does not exist returns 404", async () => {
      const response = await request(app).delete(
        "/api/sectionapi/sections/999",
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Cannot find section with id=999.",
      });
    });
  });
});
