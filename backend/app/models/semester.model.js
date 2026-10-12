export default (sequelize, Sequelize) =>
  sequelize.define("semester", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    // Present when Feature 3 has been merged into the shared DB.
    startDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    endDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
