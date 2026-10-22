/**
 * Feature 8 — Student Section Listing
 * Spec: features/feature-8-student-section-listing.md
 */
import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const toSectionPayload = (section) => ({
  id: section.id,
  sectionNumber: section.sectionNumber,
  semester: section.semester.name,
  courseID: section.course.courseID,
  facultyId: section.facultyId,
  daysOfWeek: section.daysOfWeek,
  startTime: section.startTime,
  endTime: section.endTime,
});

exports.findMine = async (req, res) => {
  try {
    const rows = await db.enrollment.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.section,
          required: true,
          include: [
            { model: db.semester, required: true },
            { model: db.course, required: true },
          ],
        },
      ],
    });

    const byId = new Map();

    for (const row of rows) {
      const section = row.section;

      if (section && !byId.has(section.id)) {
        byId.set(section.id, section);
      }
    }

    const sections = [...byId.values()]
      .sort((a, b) => a.id - b.id)
      .map(toSectionPayload);

    return res.status(200).send(sections);
  } catch (err) {
    logger.error(`List enrolled sections failed: ${err.message}`);
    return res.status(500).send({ message: "Could not list enrolled sections." });
  }
};

export default exports;
