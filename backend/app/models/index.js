import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

import courseModel from "./course.model.js";

db.course = courseModel(sequelize, Sequelize);

export default db;
