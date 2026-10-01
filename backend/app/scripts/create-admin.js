/**
 * Feature 1 — User Authentication & Role-Based Access
 * Spec: features/feature-1-user-auth.md (FR-008)
 *
 * Creates an admin account. Admins cannot self-register, so this is the
 * only way one comes into existence.
 *
 * Usage:
 *   npm run create-admin --prefix backend -- <username> <password> <email> <fName> <lName>
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "../models/index.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;

const [username, password, email, fName, lName] = process.argv.slice(2);

if (!username || !password || !email) {
  logger.error(
    "Usage: npm run create-admin -- <username> <password> <email> [fName] [lName]"
  );
  process.exit(1);
}

const run = async () => {
  await db.sequelize.sync();

  const normalized = username.trim().toLowerCase();
  const existing = await db.user.findOne({ where: { username: normalized } });

  if (existing) {
    if (existing.role === "admin") {
      logger.info(`Admin "${normalized}" already exists.`);
      return;
    }

    await existing.update({ role: "admin" });
    logger.info(`Promoted existing user "${normalized}" to admin.`);
    return;
  }

  await db.user.create({
    fName: fName || "Site",
    lName: lName || "Admin",
    email: email.trim(),
    username: normalized,
    password: await bcrypt.hash(password, SALT_ROUNDS),
    role: "admin",
  });

  logger.info(`Created admin "${normalized}".`);
};

run()
  .catch((err) => {
    logger.error(`create-admin failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
