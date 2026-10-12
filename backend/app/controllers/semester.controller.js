import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const parseSemesterId = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id)) {
    return null;
  }

  return id;
};

const requiredText = (value, field) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return { error: `${field} is required.` };
  }

  const text = String(value).trim();

  if (text.length > 100) {
    return { error: `${field} must be 100 characters or fewer.` };
  }

  return { text };
};

const readSemesterFields = (body) => {
  const name = requiredText(body.name, "name");
  const startDate = requiredText(body.startDate, "startDate");
  const endDate = requiredText(body.endDate, "endDate");

  if (name.error) {
    return name;
  }

  if (startDate.error) {
    return startDate;
  }

  if (endDate.error) {
    return endDate;
  }

  return {
    name: name.text,
    startDate: startDate.text,
    endDate: endDate.text,
  };
};

exports.findAll = async (_req, res) => {
  try {
    const semesters = await db.semester.findAll({
      order: [
        ["name", "ASC"],
        ["startDate", "ASC"],
        ["endDate", "ASC"],
      ],
    });

    return res.status(200).send(semesters);
  } catch (err) {
    logger.error(`semester findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch semesters." });
  }
};

exports.create = async (req, res) => {
  try {
    const fields = readSemesterFields(req.body);

    if (fields.error) {
      return res.status(400).send({ message: fields.error });
    }

    const semester = await db.semester.create(fields);

    return res.status(201).send(semester);
  } catch (err) {
    logger.error(`semester create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create semester." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseSemesterId(req.params.id);

    if (id === null) {
      return res.status(400).send({ message: "Invalid semester id." });
    }

        const semester = await db.semester.findByPk(id);

    if (!semester) {
      return res.status(404).send({
        message: `Cannot find semester with id=${id}.`,
      });
    }

    const fields = readSemesterFields(req.body);

    if (fields.error) {
      return res.status(400).send({ message: fields.error });
    }

    await semester.update(fields);

    return res.status(200).send({
      message: "Semester was updated successfully.",
    });
  } catch (err) {
    logger.error(`semester update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update semester." });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = parseSemesterId(req.params.id);

    if (id === null) {
      return res.status(400).send({ message: "Invalid semester id." });
    }

    const semester = await db.semester.findByPk(id);

    if (!semester) {
      return res.status(404).send({
        message: `Cannot find semester with id=${id}.`,
      });
    }

    await semester.destroy();

    return res.status(200).send({
      message: "Semester was deleted successfully.",
    });
  } catch (err) {
    logger.error(`semester delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete semester." });
  }
};

export default exports;
