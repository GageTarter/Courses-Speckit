import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import sectionModel from "./section.model.js";
import courseModel from "./course.model.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import facultyModel from "./faculty.model.js";
import semesterModel from "./semester.model.js";
import enrollmentModel from "./enrollment.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.faculty = facultyModel(sequelize, Sequelize);
db.semester = semesterModel(sequelize, Sequelize);
db.course = courseModel(sequelize, Sequelize);
db.section = sectionModel(sequelize, Sequelize);
db.enrollment = enrollmentModel(sequelize, Sequelize);

db.user.hasMany(db.session, { foreignKey: "userId" });
db.session.belongsTo(db.user, { foreignKey: "userId" });

db.user.hasMany(db.enrollment, { foreignKey: "userId" });
db.enrollment.belongsTo(db.user, { foreignKey: "userId" });

db.faculty.hasMany(db.section, { foreignKey: "facultyId", constraints: false });
db.section.belongsTo(db.faculty, { foreignKey: "facultyId", constraints: false });

// No DB FKs yet — Feature 5 still uses fixed semester ids; Features 2/3 own catalog rows.
db.semester.hasMany(db.section, { foreignKey: "semesterId", constraints: false });
db.course.hasMany(db.section, { foreignKey: "courseId", constraints: false });
db.section.belongsTo(db.semester, { foreignKey: "semesterId", constraints: false });
db.section.belongsTo(db.course, { foreignKey: "courseId", constraints: false });

db.section.hasMany(db.enrollment, { foreignKey: "sectionId", constraints: false });
db.enrollment.belongsTo(db.section, { foreignKey: "sectionId", constraints: false });

export default db;
