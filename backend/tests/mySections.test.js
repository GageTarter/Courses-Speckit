/**
 * Feature 8 — Student Section Listing
 * Spec: features/feature-8-student-section-listing.md
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
  const req = request(app).get("/courses/my-sections");
  return token ? req.set(authHeader(token)) : req;
};

const enroll = (userId, sectionId) =>
  db.enrollment.create({ userId, sectionId });

const addSection = async (catalog, courseFields, sectionFields) => {
  const course = await db.course.create(courseFields);
  const section = await db.section.create({
    userId: catalog.s001.userId,
    facultyId: catalog.faculty.id,
    daysOfWeek: "Monday,Wednesday",
    startTime: "11:40",
    endTime: "12:50",
    capacity: 30,
    semesterId: catalog.fall.id,
    courseId: course.id,
    sectionNumber: 1,
    ...sectionFields,
  });

  return { course, section };
};

const payload = (section, course, semesterName) => ({
  id: section.id,
  sectionNumber: section.sectionNumber,
  semester: semesterName,
  courseID: course.courseID,
  facultyId: section.facultyId,
  daysOfWeek: section.daysOfWeek,
  startTime: section.startTime,
  endTime: section.endTime,
});

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

describe("Feature 8 — Student Section Listing", () => {
  describe("US-8.1 — Browse my enrolled sections", () => {
    it("Student sees enrolled sections in id order", async () => {
      const catalog = await seedCatalog();
      const programming = await addSection(
        catalog,
        { name: "Programming I", courseID: "CMSC-1113-01" },
        { facultyId: 3 },
      );
      const { body: student } = await registerUser();

      await enroll(student.userId, catalog.s002.id);
      await enroll(student.userId, programming.section.id);

      const res = await listMine(student.token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        payload(catalog.s002, catalog.course, "Fall 2026"),
        payload(programming.section, programming.course, "Fall 2026"),
      ]);
      expect(res.body[1]).toMatchObject({
        sectionNumber: 1,
        semester: "Fall 2026",
        courseID: "CMSC-1113-01",
        facultyId: 3,
        daysOfWeek: "Monday,Wednesday",
        startTime: "11:40",
        endTime: "12:50",
      });
    });

    it("A section the student is not enrolled in is hidden", async () => {
      const catalog = await seedCatalog();
      const programming = await addSection(catalog, {
        name: "Programming I",
        courseID: "CMSC-1113-01",
      });
      await addSection(catalog, {
        name: "Data Structures",
        courseID: "CMSC 2413",
      });
      const { body: student } = await registerUser();

      await enroll(student.userId, programming.section.id);

      const res = await listMine(student.token);

      expect(res.status).toBe(200);
      expect(res.body.map((section) => section.courseID)).toEqual(["CMSC-1113-01"]);
    });

    it("Student sees only their own enrolled sections", async () => {
      const catalog = await seedCatalog();
      const programming = await addSection(catalog, {
        name: "Programming I",
        courseID: "CMSC-1113-01",
      });
      const structures = await addSection(catalog, {
        name: "Data Structures",
        courseID: "CMSC 2413",
      });
      const { body: studentA } = await registerUser();
      const { body: studentB } = await registerUser({
        username: "jroe",
        email: "jroe@example.com",
      });

      await enroll(studentA.userId, programming.section.id);
      await enroll(studentB.userId, structures.section.id);

      const res = await listMine(studentA.token);

      expect(res.status).toBe(200);
      expect(res.body.map((section) => section.courseID)).toEqual(["CMSC-1113-01"]);
    });

    it("Two sections of the same course both appear", async () => {
      const catalog = await seedCatalog();
      const programming = await addSection(catalog, {
        name: "Programming I",
        courseID: "CMSC-1113-01",
      });
      const second = await db.section.create({
        userId: catalog.s001.userId,
        facultyId: catalog.faculty.id,
        daysOfWeek: "Tuesday,Thursday",
        startTime: "13:00",
        endTime: "14:10",
        capacity: 30,
        semesterId: catalog.spring.id,
        courseId: programming.course.id,
        sectionNumber: 2,
      });
      const { body: student } = await registerUser();

      await enroll(student.userId, programming.section.id);
      await enroll(student.userId, second.id);

      const res = await listMine(student.token);

      expect(res.status).toBe(200);
      expect(res.body.map((section) => section.sectionNumber)).toEqual([1, 2]);
      expect(res.body.every((section) => section.courseID === "CMSC-1113-01")).toBe(true);
    });

    it("Dropping a section removes it", async () => {
      const catalog = await seedCatalog();
      const programming = await addSection(catalog, {
        name: "Programming I",
        courseID: "CMSC-1113-01",
      });
      const { body: student } = await registerUser();
      const enrollment = await enroll(student.userId, programming.section.id);

      const before = await listMine(student.token);
      expect(before.body.map((section) => section.courseID)).toEqual(["CMSC-1113-01"]);

      await enrollment.destroy();

      const after = await listMine(student.token);
      expect(after.status).toBe(200);
      expect(after.body).toEqual([]);
    });

    it("Unauthenticated request is rejected", async () => {
      const res = await listMine();

      expect(res.status).toBe(401);
    });

    it("Admin cannot list enrolled sections", async () => {
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
