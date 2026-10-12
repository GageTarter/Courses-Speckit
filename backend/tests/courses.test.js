/**
 * Feature 2 — Course Management
 * Spec: features/feature-2-course-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";

const validCourse = {
  name: "Programming I",
  courseID: "CMSC-1113-01",
  description: "Introduction to programming",
  semesterOffered: "Fall",
};

async function createCourse(overrides = {}) {
  const response = await request(app)
    .post("/courseapi/courses")
    .send({ ...validCourse, ...overrides });
  return response;
}

beforeAll(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await db.sequelize.close();
});

beforeEach(async () => {
  await db.course.destroy({ where: {} });
});

describe("Feature 2 — Course Management", () => {
  describe("US-2.1 — Add a catalogue course", () => {
    it("User creates a new course", async () => {
      const response = await createCourse();

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "Programming I",
        courseID: "CMSC-1113-01",
        description: "Introduction to programming",
        semesterOffered: "Fall",
      });
      expect(response.body.id).toEqual(expect.any(Number));
    });

    it("User creates a course without a description or semester offered", async () => {
      const response = await request(app).post("/courseapi/courses").send({
        name: "Programming I",
        courseID: "CMSC-1113-01",
        description: "   ",
        semesterOffered: "",
      });

      expect(response.status).toBe(201);
      expect(response.body.description).toBeNull();
      expect(response.body.semesterOffered).toBeNull();
    });

    it("User creates a course with a name that is too long", async () => {
      const response = await createCourse({ name: "A".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Course name must be 100 characters or fewer.",
      });
    });

    it("User creates a course with a description that is too long", async () => {
      const response = await createCourse({ description: "D".repeat(301) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Course description must be 300 characters or fewer.",
      });
    });

    it("User creates a course with an invalid semester offered", async () => {
      const response = await createCourse({ semesterOffered: "Monday" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Semester offered must be Fall, Spring, Summer, or Winter.",
      });
      const rows = await db.course.findAll();
      expect(rows).toHaveLength(0);
    });

    it("Non-admin cannot create a course", async () => {
      const response = await request(app)
        .post("/courseapi/courses")
        .set("Authorization", "Bearer non-admin")
        .send({
          name: "Programming I",
          courseID: "CMSC-1113-01",
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      const rows = await db.course.findAll();
      expect(rows).toHaveLength(0);
    });
  });

  describe("US-2.2 — Browse the Course List", () => {
    it("User views existing courses", async () => {
      await createCourse({ name: "Zebra" });
      await createCourse({ name: "Alpha", courseID: "CMSC-1113-02" });

      const response = await request(app).get("/courseapi/courses");

      expect(response.status).toBe(200);
      expect(response.body.map((course) => course.name)).toEqual(["Alpha", "Zebra"]);
    });
  });

  describe("US-2.3 — Correct a course's name, ID, description or semester Offered", () => {
    it("User edits a course's information", async () => {
      const created = await createCourse();
      const response = await request(app)
        .put(`/courseapi/courses/${created.body.id}`)
        .send({
          ...validCourse,
          name: "Programming II",
          courseID: "CMSC-1113-02",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Course was updated successfully." });

      const listed = await request(app).get("/courseapi/courses");
      expect(listed.body[0]).toMatchObject({
        name: "Programming II",
        courseID: "CMSC-1113-02",
      });
    });

    it("User clears a course's description and semester offered", async () => {
      const created = await createCourse();
      const response = await request(app)
        .put(`/courseapi/courses/${created.body.id}`)
        .send({
          name: "Programming I",
          courseID: "CMSC-1113-01",
          description: "",
          semesterOffered: "",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Course was updated successfully." });

      const listed = await request(app).get("/courseapi/courses");
      expect(listed.body[0].description).toBeNull();
      expect(listed.body[0].semesterOffered).toBeNull();
    });

    it("User edits a course with a name that is too long", async () => {
      const created = await createCourse();
      const response = await request(app)
        .put(`/courseapi/courses/${created.body.id}`)
        .send({ ...validCourse, name: "A".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Course name must be 100 characters or fewer.",
      });
    });

    it("User edits a course with a description that is too long", async () => {
      const created = await createCourse();
      const response = await request(app)
        .put(`/courseapi/courses/${created.body.id}`)
        .send({ ...validCourse, description: "D".repeat(301) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Course description must be 300 characters or fewer.",
      });
    });

    it("User edits a course with an invalid semester offered", async () => {
      const created = await createCourse();
      const response = await request(app)
        .put(`/courseapi/courses/${created.body.id}`)
        .send({ ...validCourse, semesterOffered: "Monday" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Semester offered must be Fall, Spring, Summer, or Winter.",
      });

      const stored = await db.course.findByPk(created.body.id);
      expect(stored.semesterOffered).toBe("Fall");
    });

    it("User updates a course with a non-numeric id", async () => {
      await createCourse();
      const response = await request(app).put("/courseapi/courses/abc").send(validCourse);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Course id must be a number." });
      const rows = await db.course.findAll();
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe("Programming I");
    });

    it("User updates a course that does not exist", async () => {
      await createCourse();
      const response = await request(app).put("/courseapi/courses/99999").send(validCourse);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Course not found." });
      const rows = await db.course.findAll();
      expect(rows).toHaveLength(1);
    });

    it("Non-admin cannot edit a course", async () => {
      const created = await createCourse();
      const response = await request(app)
        .put(`/courseapi/courses/${created.body.id}`)
        .set("Authorization", "Bearer non-admin")
        .send({ ...validCourse, name: "Changed" });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      const stored = await db.course.findByPk(created.body.id);
      expect(stored.name).toBe("Programming I");
    });
  });

  describe("US-2.4 Remove a course", () => {
    it("User removes a course", async () => {
      const created = await createCourse();
      const response = await request(app).delete(`/courseapi/courses/${created.body.id}`);

      expect([200, 204]).toContain(response.status);
      const rows = await db.course.findAll();
      expect(rows).toHaveLength(0);
    });

    it("User deletes a course with a non-numeric id", async () => {
      await createCourse();
      const response = await request(app).delete("/courseapi/courses/abc");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Course id must be a number." });
      const rows = await db.course.findAll();
      expect(rows).toHaveLength(1);
    });

    it("User deletes a course that does not exist", async () => {
      await createCourse();
      const response = await request(app).delete("/courseapi/courses/99999");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Course not found." });
      const rows = await db.course.findAll();
      expect(rows).toHaveLength(1);
    });

    it("Non-admin cannot remove a course", async () => {
      const created = await createCourse();
      const response = await request(app)
        .delete(`/courseapi/courses/${created.body.id}`)
        .set("Authorization", "Bearer non-admin");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin privileges are required." });
      const rows = await db.course.findAll();
      expect(rows.map((course) => course.name)).toEqual(["Programming I"]);
    });
  });
});
