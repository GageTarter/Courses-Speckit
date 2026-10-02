import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import sectionModel from "./section.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;


db.section = sectionModel(sequelize, Sequelize);
// Register models and associations here as features define them, e.g.:
// import userModel from "./user.model.js";
// db.user = userModel(sequelize, Sequelize);

export default db;
