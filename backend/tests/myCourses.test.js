/**
 * Feature 7 — Student Course Listing
 * Spec: features/feature-7-student-course-listing.md
 */
import request from "supertest";
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

const listMine = (token) => {
  const req = request(app).get("/courses/my-courses");
  return token ? req.set(authHeader(token)) : req;
};

const enroll = (userId, sectionId) =>
  db.enrollment.create({ userId, sectionId });

const addCourseSection = async (catalog, fields, sectionNumber) => {
  const course = await db.course.create(fields);
  const section = await db.section.create({
    userId: catalog.s001.userId,
    facultyId: catalog.faculty.id,
    daysOfWeek: "Monday,Wednesday",
    startTime: "09:00",
    endTime: "10:10",
    capacity: 30,
    semesterId: catalog.fall.id,
    courseId: course.id,
    sectionNumber,
  });

  return { course, section };
};

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

describe("Feature 7 — Student Course Listing", () => {
  describe("US-7.1 — Browse my enrolled courses", () => {
    it("Student sees enrolled courses in alphabetical order", async () => {
      const catalog = await seedCatalog();
      await catalog.course.update({
        description: "Team software project",
        semesterOffered: "Fall",
      });
      const programming = await addCourseSection(
        catalog,
        {
          name: "Programming I",
          courseID: "CMSC-1113-01",
          description: "Introduction to programming",
          semesterOffered: "Fall",
        },
        1,
      );
      const { body: student } = await registerUser();

      await enroll(student.userId, catalog.s001.id);
      await enroll(student.userId, programming.section.id);

      const res = await listMine(student.token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          id: programming.course.id,
          name: "Programming I",
          courseID: "CMSC-1113-01",
          description: "Introduction to programming",
          semesterOffered: "Fall",
        },
        {
          id: catalog.course.id,
          name: "Software Engineering IV",
          courseID: "CMSC 4123",
          description: "Team software project",
          semesterOffered: "Fall",
        },
      ]);
    });

    it("A course the student is not enrolled in is hidden", async () => {
      const catalog = await seedCatalog();
      const programming = await addCourseSection(
        catalog,
        {
          name: "Programming I",
          courseID: "CMSC-1113-01",
          description: "Introduction to programming",
          semesterOffered: "Spring",
        },
        1,
      );
      const { body: student } = await registerUser();

      await enroll(student.userId, programming.section.id);

      const res = await listMine(student.token);

      expect(res.status).toBe(200);
      expect(res.body.map((course) => course.name)).toEqual(["Programming I"]);
    });

    it("Student sees only their own enrolled courses", async () => {
      const catalog = await seedCatalog();
      const programming = await addCourseSection(
        catalog,
        { name: "Programming I", courseID: "CMSC-1113-01" },
        1,
      );
      const structures = await addCourseSection(
        catalog,
        { name: "Data Structures", courseID: "CMSC 2413" },
        1,
      );
      const { body: studentA } = await registerUser();
      const { body: studentB } = await registerUser({
        username: "jroe",
        email: "jroe@example.com",
      });

      await enroll(studentA.userId, programming.section.id);
      await enroll(studentB.userId, structures.section.id);

      const res = await listMine(studentA.token);

      expect(res.status).toBe(200);
      expect(res.body.map((course) => course.name)).toEqual(["Programming I"]);
    });

    it("The same course enrolled twice appears once", async () => {
      const catalog = await seedCatalog();
      const programming = await addCourseSection(
        catalog,
        { name: "Programming I", courseID: "CMSC-1113-01" },
        1,
      );
      const secondSection = await db.section.create({
        userId: catalog.s001.userId,
        facultyId: catalog.faculty.id,
        daysOfWeek: "Tuesday,Thursday",
        startTime: "13:00",
        endTime: "14:10",
        capacity: 30,
        semesterId: catalog.spring.id,
        courseId: programming.course.id,
        sectionNumber: 1,
      });
      const { body: student } = await registerUser();

      await enroll(student.userId, programming.section.id);
      await enroll(student.userId, secondSection.id);

      const res = await listMine(student.token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Programming I");
    });

    it("Dropping the last section removes the course", async () => {
      const catalog = await seedCatalog();
      const programming = await addCourseSection(
        catalog,
        { name: "Programming I", courseID: "CMSC-1113-01" },
        1,
      );
      const { body: student } = await registerUser();
      const enrollment = await enroll(student.userId, programming.section.id);

      const before = await listMine(student.token);
      expect(before.body.map((course) => course.name)).toEqual(["Programming I"]);

      await enrollment.destroy();

      const after = await listMine(student.token);
      expect(after.status).toBe(200);
      expect(after.body).toEqual([]);
    });

    it("Unauthenticated request is rejected", async () => {
      const res = await listMine();

      expect(res.status).toBe(401);
    });

    it("Admin cannot list enrolled courses", async () => {
      const admin = await seedAdmin();
      const signedIn = await login(admin.username, admin.password);

      const res = await listMine(signedIn.body.token);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        message: "Forbidden! Student access required.",
      });
    });
  });
});
