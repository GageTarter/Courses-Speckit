/**
 * Feature 6 — Section Enrollment (catalog read APIs)
 * Spec: features/feature-6-enrollment-management.md
 */
import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const remainingSeats = async (section) => {
  const taken = await db.enrollment.count({ where: { sectionId: section.id } });
  return Math.max(0, section.capacity - taken);
};

const toSectionPayload = async (section) => {
  const course = section.course;
  return {
    id: section.id,
    sectionNumber: section.sectionNumber,
    capacity: section.capacity,
    remainingSeats: await remainingSeats(section),
    semesterId: section.semesterId,
    courseId: section.courseId,
    course: course
      ? { id: course.id, code: course.code, title: course.title }
      : null,
  };
};

exports.findAllSemesters = async (_req, res) => {
  const rows = await db.semester.findAll({ order: [["id", "ASC"]] });
  return res.send(rows);
};

exports.findAllSections = async (req, res) => {
  const semesterId = parseInt(req.query.semesterId, 10);

  if (Number.isNaN(semesterId)) {
    return res.status(400).send({ message: "semesterId is required." });
  }

  try {
    const rows = await db.section.findAll({
      where: { semesterId },
      include: [{ model: db.course }],
      order: [["id", "ASC"]],
    });

    const payload = await Promise.all(rows.map(toSectionPayload));
    return res.send(payload);
  } catch (err) {
    logger.error(`List sections failed: ${err.message}`);
    return res.status(500).send({ message: "Could not list sections." });
  }
};

export default exports;
