/**
 * Feature 7 — Student Course Listing
 * Spec: features/feature-7-student-course-listing.md
 */
import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const toCoursePayload = (course) => ({
  id: course.id,
  name: course.name,
  courseID: course.courseID,
  description: course.description,
  semesterOffered: course.semesterOffered,
});

exports.findMine = async (req, res) => {
  try {
    const rows = await db.enrollment.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.section,
          required: true,
          include: [{ model: db.course, required: true }],
        },
      ],
    });

    const byId = new Map();

    for (const row of rows) {
      const course = row.section?.course;

      if (course && !byId.has(course.id)) {
        byId.set(course.id, toCoursePayload(course));
      }
    }

    const courses = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).send(courses);
  } catch (err) {
    logger.error(`List enrolled courses failed: ${err.message}`);
    return res.status(500).send({ message: "Could not list enrolled courses." });
  }
};

export default exports;
