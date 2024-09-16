const Sequelize = require("sequelize")

const sequelize = require("../util/database")

const User = sequelize.define(
  "user",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    email: { type: Sequelize.STRING, require: true, allowNull: false },
    password: { type: Sequelize.STRING, require: true, allowNull: false },
  },
  {
    timestamps: true,
  }
)

module.exports = User
