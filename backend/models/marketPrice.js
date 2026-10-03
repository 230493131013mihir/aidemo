/**
 * marketPrice.js
 * Market Price Sequelize Model
 * HarvestMitra AI - ISSUE-11
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MarketPrice = sequelize.define(
  "MarketPrice",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    market_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    crop_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price_per_kg: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false
    },
    price_per_quintal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    min_price: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    max_price: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    data_type: {
      type: DataTypes.ENUM("verified_live", "sample_demo"),
      defaultValue: "sample_demo"
    },
    price_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  },
  {
    tableName: "market_prices",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = MarketPrice;
