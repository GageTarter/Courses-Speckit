import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const SEMESTERS = ["Fall", "Spring", "Summer", "Winter"];

const parseCourseId = (value) => parseInt(value, 10);

const normalizeSemester = (raw) => {
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    return { value: null };
  }
  if (typeof raw !== "string" || !SEMESTERS.includes(raw.trim())) {
    return { error: "Semester offered must be Fall, Spring, Summer, or Winter." };
  }
  return { value: raw.trim() };
};

const normalizeRequiredText = (raw, emptyMessage, max, tooLongMessage) => {
  if (typeof raw !== "string") {
    return { error: emptyMessage };
  }

  const value = raw.trim();
  if (!value) {
    return { error: emptyMessage };
  }

  if (value.length > max) {
    return { error: tooLongMessage };
  }

  return { value };
};

const normalizeOptionalText = (raw, max, tooLongMessage) => {
  if (raw == null) {
    return { value: null };
  }

  if (typeof raw !== "string") {
    return { error: tooLongMessage };
  }

  const value = raw.trim();
  if (!value) {
    return { value: null };
  }

  if (value.length > max) {
    return { error: tooLongMessage };
  }

  return { value };
};

const readCourseBody = (body) => {
  const name = normalizeRequiredText(
    body?.name,
    "Course name is required.",
    100,
    "Course name must be 100 characters or fewer.",
  );
  if (name.error) {
    return name;
  }

  const courseID = normalizeRequiredText(
    body?.courseID,
    "Course ID is required.",
    100,
    "Course ID must be 100 characters or fewer.",
  );
  if (courseID.error) {
    return courseID;
  }

  const description = normalizeOptionalText(
    body?.description,
    300,
    "Course description must be 300 characters or fewer.",
  );
  if (description.error) {
    return description;
  }

  const semesterOffered = normalizeSemester(body?.semesterOffered);
  if (semesterOffered.error) {
    return semesterOffered;
  }

  return {
    value: {
      name: name.value,
      courseID: courseID.value,
      description: description.value,
      semesterOffered: semesterOffered.value,
    },
  };
};

exports.findAll = async (req, res) => {
  try {
    const courses = await db.course.findAll({
      order: [["name", "ASC"]],
    });
    return res.status(200).send(courses);
  } catch (err) {
    logger.error(`Course findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to fetch courses." });
  }
};

exports.create = async (req, res) => {
  const parsed = readCourseBody(req.body);
  if (parsed.error) {
    return res.status(400).send({ message: parsed.error });
  }

  try {
    const duplicate = await db.course.findOne({ where: { name: parsed.value.name } });
    if (duplicate) {
      return res.status(400).send({
        message: "Course name is in use. Enter a different course name.",
      });
    }

    const course = await db.course.create(parsed.value);
    return res.status(201).send(course);
  } catch (err) {
    logger.error(`Course create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create course." });
  }
};

exports.update = async (req, res) => {
  const id = parseCourseId(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "Course id must be a number." });
  }

  const parsed = readCourseBody(req.body);
  if (parsed.error) {
    return res.status(400).send({ message: parsed.error });
  }

  try {
    const course = await db.course.findByPk(id);
    if (!course) {
      return res.status(404).send({ message: "Course not found." });
    }

    const duplicate = await db.course.findOne({ where: { name: parsed.value.name } });
    if (duplicate && duplicate.id !== course.id) {
      return res.status(400).send({
        message: "Course name is in use. Enter a different course name.",
      });
    }

    await course.update(parsed.value);
    return res.status(200).send({ message: "Course was updated successfully." });
  } catch (err) {
    logger.error(`Course update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update course." });
  }
};

exports.remove = async (req, res) => {
  const id = parseCourseId(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "Course id must be a number." });
  }

  try {
    const course = await db.course.findByPk(id);
    if (!course) {
      return res.status(404).send({ message: "Course not found." });
    }

    await course.destroy();
    return res.status(200).send();
  } catch (err) {
    logger.error(`Course delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete course." });
  }
};

export default exports;
