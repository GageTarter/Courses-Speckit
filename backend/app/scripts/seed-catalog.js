/**
 * Feature 6 — Section Enrollment
 * Spec: features/feature-6-enrollment-management.md (FR-015)
 *
 * Inserts demo catalog rows. Idempotent on course code / semester name.
 *
 *   npm run seed-catalog --prefix backend
 */
import "dotenv/config";
import db from "../models/index.js";
import logger from "../config/logger.js";

const run = async () => {
  await db.sequelize.sync();

  const [fall] = await db.semester.findOrCreate({
    where: { name: "Fall 2026" },
    defaults: { name: "Fall 2026" },
  });
  const [spring] = await db.semester.findOrCreate({
    where: { name: "Spring 2027" },
    defaults: { name: "Spring 2027" },
  });

  const [cmsc] = await db.course.findOrCreate({
    where: { code: "CMSC 4123" },
    defaults: { code: "CMSC 4123", title: "Software Engineering IV" },
  });

  await db.section.findOrCreate({
    where: { semesterId: fall.id, courseId: cmsc.id, sectionNumber: "001" },
    defaults: {
      semesterId: fall.id,
      courseId: cmsc.id,
      sectionNumber: "001",
      capacity: 30,
    },
  });

  await db.section.findOrCreate({
    where: { semesterId: fall.id, courseId: cmsc.id, sectionNumber: "002" },
    defaults: {
      semesterId: fall.id,
      courseId: cmsc.id,
      sectionNumber: "002",
      capacity: 30,
    },
  });

  logger.info(
    `Catalog ready: ${fall.name} (sections 001, 002), ${spring.name} (no sections).`
  );
};

run()
  .catch((err) => {
    logger.error(`seed-catalog failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
