const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CropAggregation = sequelize.define(
    "CropAggregation",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        aggregationCode: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            field: "aggregation_code"
        },
        fpoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "fpo_id"
        },
        cropName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "crop_name"
        },
        variety: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "variety"
        },
        grade: {
            type: DataTypes.STRING(50),
            defaultValue: "Grade A",
            field: "grade"
        },
        totalQuantityKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            field: "total_quantity_kg"
        },
        availableQuantityKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            field: "available_quantity_kg"
        },
        unit: {
            type: DataTypes.STRING(20),
            defaultValue: "kg",
            field: "unit"
        },
        expectedRatePerKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "expected_rate_per_kg"
        },
        pickupDistrict: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "Pune",
            field: "pickup_district"
        },
        pickupHub: {
            type: DataTypes.STRING(200),
            allowNull: true,
            field: "pickup_hub"
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: "draft", // 'draft', 'ready', 'offered', 'confirmed', 'in_transit', 'completed', 'cancelled'
            field: "status"
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "notes"
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "created_by"
        }
    },
    {
        tableName: "crop_aggregations",
        underscored: true,
        timestamps: true
    }
);

module.exports = CropAggregation;
