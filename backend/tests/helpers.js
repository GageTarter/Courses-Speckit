import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";

/** Sync schema for tests. */
export const syncTestDatabase = async () => {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of [
    "enrollments",
    "sections",
    "courses",
    "semesters",
    "faculties",
    "faculty",
    "sessions",
    "users",
  ]) {
    await db.sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  await db.sequelize.sync({ force: true });
};

export const closeTestDatabase = async () => {
  await db.sequelize.close();
};

export const validRegistration = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "secret123",
  ...overrides,
});

export const registerUser = (overrides = {}) =>
  request(app).post("/courses/register").send(validRegistration(overrides));

export const login = (username, password) =>
  request(app).post("/courses/login").send({ username, password });

/** Admins never self-register, so seed them the way the script does. */
export const seedAdmin = async (overrides = {}) => {
  const fields = {
    fName: "Site",
    lName: "Admin",
    email: "admin@example.com",
    username: "admin",
    password: "adminpass123",
    ...overrides,
  };

  await db.user.create({
    ...fields,
    password: await bcrypt.hash(fields.password, 10),
    role: "admin",
  });

  return fields;
};

/** Register a student and return their Bearer token. */
export const tokenForNewStudent = async (overrides = {}) => {
  const res = await registerUser(overrides);
  return res.body.token;
};

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** Minimum catalog Feature 6 needs so enrollment tests do not wait on Features 2/3/5. */
export const seedCatalog = async () => {
  const admin = await seedAdmin({
    username: "catalogadmin",
    email: "catalogadmin@example.com",
  });
  const adminRow = await db.user.findOne({ where: { username: admin.username } });

  const faculty = await db.faculty.create({
    firstName: "Ada",
    lastName: "Lovelace",
    dept: "Computer Science",
  });

  const fall = await db.semester.create({ name: "Fall 2026" });
  const spring = await db.semester.create({ name: "Spring 2027" });
  const course = await db.course.create({
    name: "Software Engineering IV",
    courseID: "CMSC 4123",
  });

  const sectionDefaults = {
    userId: adminRow.id,
    facultyId: faculty.id,
    daysOfWeek: "Monday,Wednesday",
    startTime: "11:40",
    endTime: "12:50",
    capacity: 30,
    semesterId: fall.id,
    courseId: course.id,
  };

  const s001 = await db.section.create({
    ...sectionDefaults,
    sectionNumber: 1,
  });
  const s002 = await db.section.create({
    ...sectionDefaults,
    sectionNumber: 2,
  });

  return { fall, spring, course, s001, s002, faculty, admin };
};
