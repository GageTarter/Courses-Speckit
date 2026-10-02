/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;
const SESSION_TTL_SECONDS = 86400;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const exports = {};

const sessionPayload = (user, session) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token: session.token,
});

/** Reuse a live session for this user before minting another token. */
const issueSession = async (user) => {
  const existing = await db.session.findOne({
    where: { userId: user.id, expirationDate: { [Op.gt]: new Date() } },
  });

  if (existing) {
    return existing;
  }

  const token = jwt.sign({ id: user.id, role: user.role }, authConfig.secret, {
    expiresIn: SESSION_TTL_SECONDS,
  });

  return db.session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    userId: user.id,
  });
};

exports.register = async (req, res) => {
  const fName = (req.body.fName || "").trim();
  const lName = (req.body.lName || "").trim();
  const email = (req.body.email || "").trim();
  const username = (req.body.username || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!fName) {
    return res.status(400).send({ message: "First name is required." });
  }

  if (!lName) {
    return res.status(400).send({ message: "Last name is required." });
  }

  if (!email) {
    return res.status(400).send({ message: "Email is required." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ message: "Enter a valid email address." });
  }

  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }

  if (!password) {
    return res.status(400).send({ message: "Password is required." });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .send({ message: "Password must be at least 8 characters." });
  }

  if (await db.user.findOne({ where: { username } })) {
    return res.status(400).send({ message: "Username is already taken." });
  }

  if (await db.user.findOne({ where: { email } })) {
    return res.status(400).send({ message: "Email is already registered." });
  }

  try {
    const user = await db.user.create({
      fName,
      lName,
      email,
      username,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      // Role is never taken from the request body — self-registration
      // always produces a student (FR-007).
      role: "student",
    });

    const session = await issueSession(user);

    return res.status(201).send(sessionPayload(user, session));
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .send({ message: "Username or email is already registered." });
    }

    logger.error(`Registration failed: ${err.message}`);
    return res.status(500).send({ message: "Could not create the account." });
  }
};

exports.login = async (req, res) => {
  const username = (req.body.username || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }

  if (!password) {
    return res.status(400).send({ message: "Password is required." });
  }

  // unscoped() so the password hash is available to compare against.
  const user = await db.user.unscoped().findOne({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    logger.warn(`Failed login attempt for username=${username}`);
    return res.status(401).send({ message: "Invalid username or password." });
  }

  const session = await issueSession(user);

  return res.send(sessionPayload(user, session));
};

exports.logout = async (req, res) => {
  await req.session.destroy();

  return res.send({ message: "Logged out." });
};

export default exports;
