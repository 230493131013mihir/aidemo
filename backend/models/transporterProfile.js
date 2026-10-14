const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransporterProfile = sequelize.define(
    "TransporterProfile",
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
        driverName: {
            type: DataTypes.STRING(120),
            allowNull: false,
            field: "driver_name"
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        vehicleType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "Mahindra Bolero Maxi",
            field: "vehicle_type"
        },
        vehicleNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "vehicle_number"
        },
        capacityKg: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2000,
            field: "capacity_kg"
        },
        baseMandi: {
            type: DataTypes.STRING(160),
            allowNull: false,
            defaultValue: "Surat APMC",
            field: "base_mandi"
        },
        ratePerKm: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 25,
            field: "rate_per_km"
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: "is_available"
        }
    },
    {
        tableName: "transporter_profiles",
        underscored: true,
        timestamps: true
    }
);

module.exports = TransporterProfile;
