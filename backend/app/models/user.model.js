export default (sequelize, Sequelize) => {
  const User = sequelize.define(
    "user",
    {
      fName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "student",
      },
    },
    {
      // Password hashes never leave the database unless explicitly unscoped.
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
    }
  );

  return User;
};
