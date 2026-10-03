/**
 * crop.js
 * Crop Sequelize Model
 * HarvestMitra AI - ISSUE-11
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Crop = sequelize.define(
  "Crop",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name_en: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    name_gu: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    name_hi: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM("vegetable", "grain", "fruit", "pulse", "oilseed"),
      defaultValue: "vegetable"
    },
    shelf_life_days: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    }
  },
  {
    tableName: "crops",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = Crop;
