export default (sequelize, Sequelize) => {
  const Faculty = sequelize.define(
    "faculty",
    {
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      dept: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "faculties",
    },
  );

  return Faculty;
};
