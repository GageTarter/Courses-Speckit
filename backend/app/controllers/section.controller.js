
import db from "../models/index.js";
import logger from "../config/logger.js";
import { parseId } from "../helpers/fields.js";

const exports = {};

const OFFERED_SEMESTER_IDS = new Set([1, 2, 3, 4]);

const parseSectionNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return { error: "sectionNumber is required." };
  }

  const sectionNumber = Number(value);

  if (
    !Number.isInteger(sectionNumber) ||
    sectionNumber < 1 ||
    sectionNumber > 99
  ) {
    return { error: "sectionNumber must be an integer from 1 to 99." };
  }

  return { sectionNumber };
};

const isValidTime = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
};

exports.findAll = async (req, res) => {
  try {
    const sections = await db.section.findAll({
      where: { userId: req.user.id },
      order: [["sectionNumber", "ASC"]],
    });

    return res.status(200).send(sections);
  } catch (err) {
    logger.error(`section findAll failed: ${err.message}`);

    return res.status(500).send({
      message: "Failed to fetch sections.",
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { sectionNumber, error: sectionNumberError } = parseSectionNumber(
      req.body.sectionNumber
    );
    const semesterId = parseId(req.body.semesterId);
    const courseId = parseId(req.body.courseId);
    const facultyId = parseId(req.body.facultyId);
    const daysOfWeek = req.body.daysOfWeek;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;

    if (sectionNumberError) {
      return res.status(400).send({
        message: sectionNumberError,
      });
    }

    if (semesterId === null) {
      return res.status(400).send({
        message: "semesterId is required.",
      });
    }

    if (!OFFERED_SEMESTER_IDS.has(semesterId)) {
      return res.status(400).send({
        message: "semesterId must be Fall, Winter, Spring, or Summer.",
      });
    }

    if (courseId === null) {
      return res.status(400).send({
        message: "courseId is required.",
      });
    }

    if (facultyId === null) {
      return res.status(400).send({
        message: "facultyId is required.",
      });
    }

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).send({
        message: "daysOfWeek is required.",
      });
    }

    if (!startTime) {
      return res.status(400).send({
        message: "startTime is required.",
      });
    }

    if (!isValidTime(startTime)) {
      return res.status(400).send({
        message: "startTime must be in HH:MM format.",
      });
    }

    if (!endTime) {
      return res.status(400).send({
        message: "endTime is required.",
      });
    }

    if (!isValidTime(endTime)) {
      return res.status(400).send({
        message: "endTime must be in HH:MM format.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).send({
        message: "startTime must be earlier than endTime.",
      });
    }

    const section = await db.section.create({
      userId: req.user.id,
      sectionNumber,
      semesterId,
      courseId,
      facultyId,
      daysOfWeek: daysOfWeek.join(","),
      startTime,
      endTime,
    });

    return res.status(201).send(section);
  } catch (err) {
    logger.error(`section create failed: ${err.message}`);

    return res.status(500).send({
      message: "Failed to create section.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const sectionId = parseId(req.params.sectionId);

    if (sectionId === null) {
      return res.status(400).send({
        message: "Invalid section id.",
      });
    }

    const section = await db.section.findOne({
      where: {
        id: sectionId,
        userId: req.user.id,
      },
    });

    if (!section) {
      return res.status(404).send({
        message: `Cannot find section with id=${sectionId}.`,
      });
    }

    const { sectionNumber, error: sectionNumberError } = parseSectionNumber(
      req.body.sectionNumber
    );
    const semesterId = parseId(req.body.semesterId);
    const courseId = parseId(req.body.courseId);
    const facultyId = parseId(req.body.facultyId);
    const daysOfWeek = req.body.daysOfWeek;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;

    if (sectionNumberError) {
      return res.status(400).send({
        message: sectionNumberError,
      });
    }

    if (semesterId === null) {
      return res.status(400).send({
        message: "semesterId is required.",
      });
    }

    if (!OFFERED_SEMESTER_IDS.has(semesterId)) {
      return res.status(400).send({
        message: "semesterId must be Fall, Winter, Spring, or Summer.",
      });
    }

    if (courseId === null) {
      return res.status(400).send({
        message: "courseId is required.",
      });
    }

    if (facultyId === null) {
      return res.status(400).send({
        message: "facultyId is required.",
      });
    }

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).send({
        message: "daysOfWeek is required.",
      });
    }

    if (!startTime) {
      return res.status(400).send({
        message: "startTime is required.",
      });
    }

    if (!isValidTime(startTime)) {
      return res.status(400).send({
        message: "startTime must be in HH:MM format.",
      });
    }

    if (!endTime) {
      return res.status(400).send({
        message: "endTime is required.",
      });
    }

    if (!isValidTime(endTime)) {
      return res.status(400).send({
        message: "endTime must be in HH:MM format.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).send({
        message: "startTime must be earlier than endTime.",
      });
    }

    await db.section.update(
      {
        sectionNumber,
        semesterId,
        courseId,
        facultyId,
        daysOfWeek: daysOfWeek.join(","),
        startTime,
        endTime,
      },
      {
        where: {
          id: sectionId,
          userId: req.user.id,
        },
      }
    );

    return res.status(200).send({
      message: "Section was updated successfully.",
    });
  } catch (err) {
    logger.error(`section update failed: ${err.message}`);

    return res.status(500).send({
      message: "Failed to update section.",
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const sectionId = parseId(req.params.sectionId);

    if (sectionId === null) {
      return res.status(400).send({
        message: "Invalid section id.",
      });
    }

    const section = await db.section.findOne({
      where: {
        id: sectionId,
        userId: req.user.id,
      },
    });

    if (!section) {
      return res.status(404).send({
        message: `Cannot find section with id=${sectionId}.`,
      });
    }

    await db.section.destroy({
      where: {
        id: sectionId,
        userId: req.user.id,
      },
    });

    return res.status(200).send({
      message: "Section was deleted successfully.",
    });
  } catch (err) {
    logger.error(`section delete failed: ${err.message}`);

    return res.status(500).send({
      message: "Failed to delete section.",
    });
  }
};

export default exports;
