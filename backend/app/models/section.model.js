export default (sequelize, Sequelize) => {
  const Section = sequelize.define("section", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    sectionNumber: {
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

    facultyId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    daysOfWeek: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    startTime: {
      type: Sequelize.STRING(5),
      allowNull: false,
    },
    
    endTime: {
      type: Sequelize.STRING(5),
      allowNull: false,
    },
  });

  return Section;
};