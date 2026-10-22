const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SharedTrip = sequelize.define(
    "SharedTrip",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        tripCode: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            field: "trip_code"
        },
        transporterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "transporter_id"
        },
        vehicleId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "vehicle_id"
        },
        pickupLocation: {
            type: DataTypes.STRING(160),
            allowNull: false,
            field: "pickup_location"
        },
        destinationMarket: {
            type: DataTypes.STRING(160),
            allowNull: false,
            field: "destination_market"
        },
        tripDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "trip_date"
        },
        totalCapacityKg: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "total_capacity_kg"
        },
        bookedWeightKg: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: "booked_weight_kg"
        },
        remainingCapacityKg: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: "remaining_capacity_kg"
        },
        totalFare: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: "total_fare"
        },
        compatibleCategory: {
            type: DataTypes.STRING(64),
            defaultValue: "general",
            field: "compatible_category"
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: "open",
            validate: {
                isIn: [["open", "matched", "confirmed", "in_transit", "delivered", "completed", "cancelled"]]
            }
        }
    },
    {
        tableName: "shared_trips",
        underscored: true,
        timestamps: true
    }
);

module.exports = SharedTrip;
