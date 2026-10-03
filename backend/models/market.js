/**
 * market.js
 * Market (Mandi) Sequelize Model
 * HarvestMitra AI - ISSUE-11
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Market = sequelize.define(
  "Market",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    distance_from_surat_km: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.0
    },
    operating_days: {
      type: DataTypes.STRING(100),
      defaultValue: "Mon-Sat"
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  },
  {
    tableName: "markets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = Market;
