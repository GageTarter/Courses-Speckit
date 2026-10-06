import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import sectionModel from "./section.model.js";
import courseModel from "./course.model.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import facultyModel from "./faculty.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.section = sectionModel(sequelize, Sequelize);
db.course = courseModel(sequelize, Sequelize);
db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.faculty = facultyModel(sequelize, Sequelize);

db.user.hasMany(db.session, { foreignKey: "userId" });
db.session.belongsTo(db.user, { foreignKey: "userId" });

db.faculty.hasMany(db.section, { foreignKey: "facultyId" });
db.section.belongsTo(db.faculty, { foreignKey: "facultyId" });

export default db;
