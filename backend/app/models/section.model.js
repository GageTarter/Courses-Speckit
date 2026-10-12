export default (sequelize, Sequelize) =>
  sequelize.define("section", {
    sectionNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    capacity: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    semesterId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    courseId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    // Present when Feature 5 has been merged into the shared DB.
    facultyId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    daysOfWeek: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    startTime: {
      type: Sequelize.STRING(5),
      allowNull: true,
    },
    endTime: {
      type: Sequelize.STRING(5),
      allowNull: true,
    },
  });
