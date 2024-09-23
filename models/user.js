const Sequelize = require("sequelize")

const sequelize = require("../util/database")

const User = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  email: { type: Sequelize.STRING, required: true },
  password: { type: Sequelize.STRING, required: true },
  // resetToken: { type: Sequelize.STRING },
  // resetTokenExpiration: { type: Sequelize.DATE },
})

module.exports = User
