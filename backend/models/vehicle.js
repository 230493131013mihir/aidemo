const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Vehicle = sequelize.define(
    "Vehicle",
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
        registrationNumber: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            field: "registration_number"
        },
        vehicleType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "Mahindra Bolero Maxi Truck",
            field: "vehicle_type"
        },
        capacityKg: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2000,
            field: "capacity_kg"
        },
        capacityUnit: {
            type: DataTypes.STRING(32),
            allowNull: false,
            defaultValue: "kg",
            field: "capacity_unit"
        },
        supportedCrops: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "Tomato, Onion, Potato, Vegetables",
            field: "supported_crops"
        },
        specialHandling: {
            type: DataTypes.STRING(160),
            allowNull: false,
            defaultValue: "Ventilated",
            field: "special_handling"
        },
        baseLocation: {
            type: DataTypes.STRING(160),
            allowNull: false,
            defaultValue: "Pune, Maharashtra",
            field: "base_location"
        },
        supportedRoutes: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "Pune to Mumbai Vashi APMC, Nashik APMC, Kolhapur APMC",
            field: "supported_routes"
        },
        availableDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "available_date"
        },
        ratePerKm: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 25,
            field: "rate_per_km"
        },
        driverName: {
            type: DataTypes.STRING(120),
            allowNull: false,
            field: "driver_name"
        },
        driverPhone: {
            type: DataTypes.STRING(32),
            allowNull: false,
            field: "driver_phone"
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_available"
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: "available",
            validate: {
                isIn: [["available", "busy", "maintenance"]]
            }
        }
    },
    {
        tableName: "vehicles",
        underscored: true,
        timestamps: true
    }
);

module.exports = Vehicle;
