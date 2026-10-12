export default (sequelize, Sequelize) =>
  sequelize.define(
    "enrollment",
    {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sectionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      enrolledAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      indexes: [{ unique: true, fields: ["userId", "sectionId"] }],
    }
  );
