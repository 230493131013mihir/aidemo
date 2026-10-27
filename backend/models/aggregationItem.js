const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AggregationItem = sequelize.define(
    "AggregationItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        aggregationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "aggregation_id"
        },
        farmerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "farmer_id"
        },
        cropName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "crop_name"
        },
        committedQuantityKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            field: "committed_quantity_kg"
        },
        farmerConsentStatus: {
            type: DataTypes.STRING(30),
            defaultValue: "pending", // 'pending', 'consented', 'withdrawn'
            field: "farmer_consent_status"
        },
        consentedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "consented_at"
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "notes"
        }
    },
    {
        tableName: "aggregation_items",
        underscored: true,
        timestamps: true
    }
);

module.exports = AggregationItem;
