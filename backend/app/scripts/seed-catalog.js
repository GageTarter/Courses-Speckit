/**
 * Feature 6 — Section Enrollment
 * Spec: features/feature-6-enrollment-management.md (FR-015)
 *
 * Inserts demo catalog rows. Idempotent on courseID / semester name.
 *
 *   npm run seed-catalog --prefix backend
 */
import "dotenv/config";
import db from "../models/index.js";
import logger from "../config/logger.js";

const run = async () => {
  await db.sequelize.sync();

  const [admin] = await db.user.findOrCreate({
    where: { username: "catalogadmin" },
    defaults: {
      fName: "Catalog",
      lName: "Admin",
      email: "catalogadmin@example.com",
      username: "catalogadmin",
      password: "unused-hash",
      role: "admin",
    },
  });

  const [faculty] = await db.faculty.findOrCreate({
    where: { firstName: "Ada", lastName: "Lovelace" },
    defaults: {
      firstName: "Ada",
      lastName: "Lovelace",
      dept: "Computer Science",
    },
  });

  const [fall] = await db.semester.findOrCreate({
    where: { name: "Fall 2026" },
    defaults: { name: "Fall 2026" },
  });
  const [spring] = await db.semester.findOrCreate({
    where: { name: "Spring 2027" },
    defaults: { name: "Spring 2027" },
  });

  const [cmsc] = await db.course.findOrCreate({
    where: { courseID: "CMSC 4123" },
    defaults: {
      courseID: "CMSC 4123",
      name: "Software Engineering IV",
    },
  });

  const sectionDefaults = {
    userId: admin.id,
    facultyId: faculty.id,
    daysOfWeek: "Monday,Wednesday",
    startTime: "11:40",
    endTime: "12:50",
    capacity: 30,
    semesterId: fall.id,
    courseId: cmsc.id,
  };

  await db.section.findOrCreate({
    where: {
      semesterId: fall.id,
      courseId: cmsc.id,
      sectionNumber: 1,
    },
    defaults: { ...sectionDefaults, sectionNumber: 1 },
  });

  await db.section.findOrCreate({
    where: {
      semesterId: fall.id,
      courseId: cmsc.id,
      sectionNumber: 2,
    },
    defaults: { ...sectionDefaults, sectionNumber: 2 },
  });

  logger.info(
    `Catalog ready: ${fall.name} (sections 01, 02), ${spring.name} (no sections).`,
  );
};

run()
  .catch((err) => {
    logger.error(`seed-catalog failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
