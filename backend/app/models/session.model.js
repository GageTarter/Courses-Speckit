export default (sequelize, Sequelize) => {
  const Session = sequelize.define("session", {
    // Sized for a signed JWT, which exceeds the 255-character STRING default.
    token: {
      type: Sequelize.STRING(512),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expirationDate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return Session;
};
