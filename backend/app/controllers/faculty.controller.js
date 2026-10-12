import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const parseFacultyId = (value) => {
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

const readFacultyFields = (body) => {
  const firstName = requiredText(body.firstName, "firstName");
  if (firstName.error) {
    return firstName;
  }

  const lastName = requiredText(body.lastName, "lastName");
  if (lastName.error) {
    return lastName;
  }

  const dept = requiredText(body.dept, "dept");
  if (dept.error) {
    return dept;
  }

  return {
    firstName: firstName.text,
    lastName: lastName.text,
    dept: dept.text,
  };
};

exports.findAll = async (_req, res) => {
  try {
    const faculties = await db.faculty.findAll({
      order: [
        ["lastName", "ASC"],
        ["firstName", "ASC"],
      ],
    });

    return res.status(200).send(faculties);
  } catch (err) {
    logger.error(`faculty findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch faculty." });
  }
};

exports.create = async (req, res) => {
  try {
    const fields = readFacultyFields(req.body);

    if (fields.error) {
      return res.status(400).send({ message: fields.error });
    }

    const faculty = await db.faculty.create(fields);

    return res.status(201).send(faculty);
  } catch (err) {
    logger.error(`faculty create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create faculty." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseFacultyId(req.params.id);

    if (id === null) {
      return res.status(400).send({ message: "Invalid faculty id." });
    }

    const faculty = await db.faculty.findByPk(id);

    if (!faculty) {
      return res.status(404).send({
        message: `Cannot find faculty with id=${id}.`,
      });
    }

    const fields = readFacultyFields(req.body);

    if (fields.error) {
      return res.status(400).send({ message: fields.error });
    }

    await faculty.update(fields);

    return res.status(200).send({
      message: "Faculty was updated successfully.",
    });
  } catch (err) {
    logger.error(`faculty update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update faculty." });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = parseFacultyId(req.params.id);

    if (id === null) {
      return res.status(400).send({ message: "Invalid faculty id." });
    }

    const faculty = await db.faculty.findByPk(id);

    if (!faculty) {
      return res.status(404).send({
        message: `Cannot find faculty with id=${id}.`,
      });
    }

    await faculty.destroy();

    return res.status(200).send({
      message: "Faculty was deleted successfully.",
    });
  } catch (err) {
    logger.error(`faculty delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete faculty." });
  }
};

export default exports;
