const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SavedScheme = sequelize.define(
  "SavedScheme",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id"
    },
    schemeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "scheme_id"
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    tableName: "saved_schemes",
    underscored: true,
    indexes: [
      { unique: true, fields: ["user_id", "scheme_id"] }
    ]
  }
);

module.exports = SavedScheme;
