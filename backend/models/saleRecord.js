const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SaleRecord = sequelize.define(
  "SaleRecord",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id"
    },
    cropName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "crop_name"
    },
    quantityKg: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "quantity_kg"
    },
    unit: {
      type: DataTypes.STRING(20),
      defaultValue: "kg"
    },
    marketName: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: "market_name"
    },
    ratePerQuintal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "rate_per_quintal"
    },
    grossProceeds: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "gross_proceeds"
    },
    transportCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "transport_cost"
    },
    inputCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "input_cost"
    },
    mandiCess: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: "mandi_cess"
    },
    netProfit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "net_profit"
    },
    saleDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "sale_date"
    },
    buyerName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "buyer_name"
    },
    paymentStatus: {
      type: DataTypes.STRING(32),
      defaultValue: "completed",
      field: "payment_status"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "sale_records",
    underscored: true,
    timestamps: true
  }
);

module.exports = SaleRecord;
