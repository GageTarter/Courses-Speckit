import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import sectionModel from "./section.model.js";
import courseModel from "./course.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.section = sectionModel(sequelize, Sequelize);
db.course = courseModel(sequelize, Sequelize);

export default db;
