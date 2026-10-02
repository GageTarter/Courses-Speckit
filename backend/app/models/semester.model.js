export default (sequelize, Sequelize) =>
  sequelize.define("semester", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
  });
