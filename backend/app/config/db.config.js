import "dotenv/config";

const dbConfig = {
  HOST: process.env.DB_HOST || "localhost",
  PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PW || "",
  DB: process.env.DB_NAME || "speckit-db",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export default dbConfig;
