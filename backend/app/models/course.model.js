export default (sequelize, Sequelize) =>
  sequelize.define("course", {
    // Feature 6 API uses code/title; shared DB (Feature 2) stores courseID/name.
    code: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      field: "courseID",
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      field: "name",
    },
  });
