/**
 * Feature 6 — Section Enrollment
 * Spec: features/feature-6-enrollment-management.md
 */
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getOwnedEnrollmentOrNull } from "../authorization/authorization.js";

const exports = {};

const sectionInclude = {
  model: db.section,
  include: [{ model: db.course }],
};

const toEnrollmentPayload = (row) => {
  const section = row.section;
  const course = section?.course;

  return {
    id: row.id,
    userId: row.userId,
    sectionId: row.sectionId,
    enrolledAt: row.enrolledAt,
    section: section
      ? {
          id: section.id,
          sectionNumber: section.sectionNumber,
          semesterId: section.semesterId,
          course: course
            ? { id: course.id, code: course.code, title: course.title }
            : null,
        }
      : undefined,
  };
};

exports.findAll = async (req, res) => {
  const where = { userId: req.user.id };
  const include = [{ ...sectionInclude }];

  const semesterId = parseInt(req.query.semesterId, 10);
  if (!Number.isNaN(semesterId)) {
    include[0].where = { semesterId };
    include[0].required = true;
  }

  const rows = await db.enrollment.findAll({
    where,
    include,
    order: [["id", "ASC"]],
  });

  return res.send(rows.map(toEnrollmentPayload));
};

exports.create = async (req, res) => {
  const sectionId = parseInt(req.body.sectionId, 10);

  if (Number.isNaN(sectionId)) {
    return res.status(400).send({ message: "sectionId is required." });
  }

  const section = await db.section.findByPk(sectionId);

  if (!section) {
    return res.status(404).send({ message: `Section with id=${sectionId} not found.` });
  }

  const alreadyInSection = await db.enrollment.findOne({
    where: { userId: req.user.id, sectionId },
  });

  if (alreadyInSection) {
    return res.status(400).send({ message: "You are already enrolled in this section." });
  }

  const sameCourse = await db.enrollment.findOne({
    where: { userId: req.user.id },
    include: [
      {
        model: db.section,
        required: true,
        where: {
          courseId: section.courseId,
          semesterId: section.semesterId,
        },
      },
    ],
  });

  if (sameCourse) {
    return res
      .status(400)
      .send({ message: "You are already enrolled in another section of this course." });
  }

  const taken = await db.enrollment.count({ where: { sectionId } });

  if (taken >= section.capacity) {
    return res.status(400).send({ message: "This section is full." });
  }

  try {
    const created = await db.enrollment.create({
      userId: req.user.id,
      sectionId,
    });

    return res.status(201).send({
      id: created.id,
      userId: created.userId,
      sectionId: created.sectionId,
      enrolledAt: created.enrolledAt,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).send({ message: "You are already enrolled in this section." });
    }

    logger.error(`Enroll failed: ${err.message}`);
    return res.status(500).send({ message: "Could not enroll in the section." });
  }
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(404).send({ message: `Enrollment with id=${req.params.id} not found.` });
  }

  const row = await getOwnedEnrollmentOrNull(req, id);

  if (!row) {
    return res.status(404).send({ message: `Enrollment with id=${id} not found.` });
  }

  await row.destroy();
  return res.send({ message: "Enrollment dropped." });
};

export default exports;
