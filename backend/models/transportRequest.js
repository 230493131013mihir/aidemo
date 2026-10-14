const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransportRequest = sequelize.define(
    "TransportRequest",
    {
        userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
        farmerName: { type: DataTypes.STRING(120), allowNull: false, field: "farmer_name" },
        driverName: { type: DataTypes.STRING(120), allowNull: true, field: "driver_name" },
        cropName: { type: DataTypes.STRING(100), allowNull: false, field: "crop_name" },
        pickupLocation: { type: DataTypes.STRING(160), allowNull: false, field: "pickup_location" },
        destinationMarket: { type: DataTypes.STRING(160), allowNull: false, field: "destination_market" },
        pickupDate: { type: DataTypes.DATEONLY, allowNull: false, field: "pickup_date" },
        weightKg: { type: DataTypes.INTEGER, allowNull: false, field: "weight_kg" },
        vehicleType: {
            type: DataTypes.STRING(100),
            defaultValue: "any",
            field: "vehicle_type"
        },
        vehicleNumber: { type: DataTypes.STRING(64), allowNull: true, field: "vehicle_number" },
        status: {
            type: DataTypes.ENUM("open", "matched", "accepted", "completed", "cancelled"),
            defaultValue: "open"
        },
        estimatedSharedCost: { type: DataTypes.INTEGER, field: "estimated_shared_cost" },
        gatePassCode: { type: DataTypes.STRING(64), allowNull: true, field: "gate_pass_code" }
    },
    { tableName: "transport_requests", underscored: true }
);

module.exports = TransportRequest;
