/**
 * Feature 6 — Section Enrollment
 * Spec: features/feature-6-enrollment-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  closeTestDatabase,
  registerUser,
  login,
  seedAdmin,
  seedCatalog,
  authHeader,
} from "./helpers.js";

const enroll = (token, body) =>
  request(app).post("/courses/enrollments").set(authHeader(token)).send(body);

const listEnrollments = (token, query = "") =>
  request(app).get(`/courses/enrollments${query}`).set(authHeader(token));

const listSections = (token, semesterId) =>
  request(app)
    .get("/courses/sections")
    .query(semesterId === undefined ? {} : { semesterId })
    .set(authHeader(token));

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

describe("Feature 6 — Section Enrollment", () => {
  describe("US-6.2 — Browse sections offered in the selected semester", () => {
    it("Student sees remaining seats for each section", async () => {
      const catalog = await seedCatalog();
      const { body: student } = await registerUser();

      await db.section.update({ capacity: 30 }, { where: { id: catalog.s001.id } });

      const hash = await bcrypt.hash("secret123", 4);
      for (let i = 0; i < 28; i += 1) {
        const peer = await db.user.create({
          fName: "Seat",
          lName: `Filler${i}`,
          email: `seat${i}@example.com`,
          username: `seat${i}`,
          password: hash,
          role: "student",
        });
        await db.enrollment.create({
          userId: peer.id,
          sectionId: catalog.s001.id,
        });
      }

      const res = await listSections(student.token, catalog.fall.id);
      const row = res.body.find((s) => s.id === catalog.s001.id);

      expect(res.status).toBe(200);
      expect(row.remainingSeats).toBe(2);
      expect(row.capacity).toBe(30);
      expect(row.course).toMatchObject({
        code: "CMSC 4123",
        title: "Software Engineering IV",
      });
    });
  });

  describe("US-6.3 — Enroll in a section", () => {
    it("Student enrolls in an open section", async () => {
      const catalog = await seedCatalog();
      const { body: student } = await registerUser();

      const res = await enroll(student.token, { sectionId: catalog.s001.id });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        userId: student.userId,
        sectionId: catalog.s001.id,
      });
      expect(res.body.id).toEqual(expect.any(Number));
    });

    it("Enrollment ignores a user id supplied in the request body", async () => {
      const catalog = await seedCatalog();
      const { body: studentA } = await registerUser();
      const { body: studentB } = await registerUser({
        username: "other",
        email: "other@example.com",
      });

      const res = await enroll(studentA.token, {
        sectionId: catalog.s001.id,
        userId: studentB.userId,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(studentA.userId);
    });

    it("Student enrolls in a section twice", async () => {
      const catalog = await seedCatalog();
      const { body: student } = await registerUser();

      await enroll(student.token, { sectionId: catalog.s001.id });
      const res = await enroll(student.token, { sectionId: catalog.s001.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("You are already enrolled in this section.");
      expect(await db.enrollment.count({ where: { userId: student.userId } })).toBe(1);
    });

    it("Student enrolls in a second section of the same course", async () => {
      const catalog = await seedCatalog();
      const { body: student } = await registerUser();

      await enroll(student.token, { sectionId: catalog.s001.id });
      const res = await enroll(student.token, { sectionId: catalog.s002.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "You are already enrolled in another section of this course."
      );
    });

    it("Student enrolls in a full section", async () => {
      const catalog = await seedCatalog();
      await db.section.update({ capacity: 1 }, { where: { id: catalog.s001.id } });

      const { body: other } = await registerUser({
        username: "taken",
        email: "taken@example.com",
      });
      await enroll(other.token, { sectionId: catalog.s001.id });

      const { body: student } = await registerUser();
      const res = await enroll(student.token, { sectionId: catalog.s001.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("This section is full.");
      expect(
        await db.enrollment.count({
          where: { userId: student.userId, sectionId: catalog.s001.id },
        })
      ).toBe(0);
    });

    it("Student enrolls without a section id", async () => {
      await seedCatalog();
      const { body: student } = await registerUser();

      const res = await enroll(student.token, {});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("sectionId is required.");
    });

    it("Student enrolls in a section that does not exist", async () => {
      await seedCatalog();
      const { body: student } = await registerUser();

      const res = await enroll(student.token, { sectionId: 9999 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Section with id=9999 not found.");
    });

    it("Admin cannot enroll", async () => {
      const catalog = await seedCatalog();
      const admin = await seedAdmin();
      const { body } = await login(admin.username, admin.password);

      const res = await enroll(body.token, { sectionId: catalog.s001.id });

      expect(res.status).toBe(403);
    });

    it("Unauthenticated enrollment request is rejected", async () => {
      const res = await request(app).post("/courses/enrollments").send({ sectionId: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe("US-6.4 — Review my enrollments for the semester", () => {
    it("Student sees only their own enrollments", async () => {
      const catalog = await seedCatalog();
      const { body: studentA } = await registerUser();
      const { body: studentB } = await registerUser({
        username: "bee",
        email: "bee@example.com",
      });

      await enroll(studentA.token, { sectionId: catalog.s001.id });
      await enroll(studentB.token, { sectionId: catalog.s002.id });

      const res = await listEnrollments(studentA.token);

      expect(res.status).toBe(200);
      expect(res.body.map((row) => row.sectionId)).toEqual([catalog.s001.id]);
    });

    it("Schedule is filtered by the selected semester", async () => {
      const catalog = await seedCatalog();
      const springSection = await db.section.create({
        sectionNumber: "001",
        capacity: 20,
        semesterId: catalog.spring.id,
        courseId: catalog.course.id,
      });
      const { body: student } = await registerUser();

      await enroll(student.token, { sectionId: catalog.s001.id });
      await enroll(student.token, { sectionId: springSection.id });

      const res = await listEnrollments(student.token, `?semesterId=${catalog.fall.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].section.semesterId).toBe(catalog.fall.id);
    });
  });

  describe("US-6.5 — Drop a section", () => {
    it("Student drops a section", async () => {
      const catalog = await seedCatalog();
      const { body: student } = await registerUser();
      const created = await enroll(student.token, { sectionId: catalog.s001.id });

      const res = await request(app)
        .delete(`/courses/enrollments/${created.body.id}`)
        .set(authHeader(student.token));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Enrollment dropped.");
      expect(await db.enrollment.count({ where: { userId: student.userId } })).toBe(0);
    });

    it("Dropping frees the seat", async () => {
      const catalog = await seedCatalog();
      await db.section.update({ capacity: 30 }, { where: { id: catalog.s001.id } });

      const hash = await bcrypt.hash("secret123", 4);
      for (let i = 0; i < 29; i += 1) {
        const peer = await db.user.create({
          fName: "Full",
          lName: `Filler${i}`,
          email: `full${i}@example.com`,
          username: `full${i}`,
          password: hash,
          role: "student",
        });
        await db.enrollment.create({
          userId: peer.id,
          sectionId: catalog.s001.id,
        });
      }

      const { body: student } = await registerUser();
      const mine = await enroll(student.token, { sectionId: catalog.s001.id });
      expect(mine.status).toBe(201);

      await request(app)
        .delete(`/courses/enrollments/${mine.body.id}`)
        .set(authHeader(student.token));

      const res = await listSections(student.token, catalog.fall.id);
      const row = res.body.find((s) => s.id === catalog.s001.id);

      expect(row.remainingSeats).toBe(1);
      expect(row.capacity).toBe(30);
    });
  });

  describe("US-6.6 — Keep enrollments private to the student", () => {
    it("Student drops another student's enrollment", async () => {
      const catalog = await seedCatalog();
      const { body: studentA } = await registerUser();
      const { body: studentB } = await registerUser({
        username: "bee",
        email: "bee@example.com",
      });
      const theirs = await enroll(studentB.token, { sectionId: catalog.s001.id });

      const res = await request(app)
        .delete(`/courses/enrollments/${theirs.body.id}`)
        .set(authHeader(studentA.token));

      expect(res.status).toBe(404);
      expect(await db.enrollment.count({ where: { id: theirs.body.id } })).toBe(1);
    });

    it("Student drops an enrollment that does not exist", async () => {
      await seedCatalog();
      const { body: student } = await registerUser();

      const res = await request(app)
        .delete("/courses/enrollments/9999")
        .set(authHeader(student.token));

      expect(res.status).toBe(404);
    });
  });
});
