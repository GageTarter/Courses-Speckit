import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";

/** Sync schema for tests. */
export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const closeTestDatabase = async () => {
  await db.sequelize.close();
};

export const validRegistration = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "secret123",
  ...overrides,
});

export const registerUser = (overrides = {}) =>
  request(app).post("/api/register").send(validRegistration(overrides));

export const login = (username, password) =>
  request(app).post("/api/login").send({ username, password });

/** Admins never self-register, so seed them the way the script does. */
export const seedAdmin = async (overrides = {}) => {
  const fields = {
    fName: "Site",
    lName: "Admin",
    email: "admin@example.com",
    username: "admin",
    password: "adminpass123",
    ...overrides,
  };

  await db.user.create({
    ...fields,
    password: await bcrypt.hash(fields.password, 10),
    role: "admin",
  });

  return fields;
};

/** Register a student and return their Bearer token. */
export const tokenForNewStudent = async (overrides = {}) => {
  const res = await registerUser(overrides);
  return res.body.token;
};
