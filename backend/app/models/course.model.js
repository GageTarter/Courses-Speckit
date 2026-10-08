export default (sequelize, Sequelize) =>
  sequelize.define("course", {
    code: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
