import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import semesterModel from "./semester.model.js";
import courseModel from "./course.model.js";
import sectionModel from "./section.model.js";
import enrollmentModel from "./enrollment.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.semester = semesterModel(sequelize, Sequelize);
db.course = courseModel(sequelize, Sequelize);
db.section = sectionModel(sequelize, Sequelize);
db.enrollment = enrollmentModel(sequelize, Sequelize);

db.user.hasMany(db.session, { foreignKey: "userId" });
db.session.belongsTo(db.user, { foreignKey: "userId" });

db.user.hasMany(db.enrollment, { foreignKey: "userId" });
db.enrollment.belongsTo(db.user, { foreignKey: "userId" });

db.semester.hasMany(db.section, { foreignKey: "semesterId" });
db.course.hasMany(db.section, { foreignKey: "courseId" });
db.section.belongsTo(db.semester, { foreignKey: "semesterId" });
db.section.belongsTo(db.course, { foreignKey: "courseId" });

db.section.hasMany(db.enrollment, { foreignKey: "sectionId" });
db.enrollment.belongsTo(db.section, { foreignKey: "sectionId" });

export default db;
