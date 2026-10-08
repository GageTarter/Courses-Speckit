export default (sequelize, Sequelize) => {
  const Course = sequelize.define("course", {
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    courseID: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING(300),
      allowNull: true,
    },
    semesterOffered: {
      type: Sequelize.ENUM('Fall', 'Spring', 'Summer', 'Winter'),
      allowNull: true,
    },
    courseFrequency: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    courseHours: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    courseDept: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
  });

  return Course;
};
