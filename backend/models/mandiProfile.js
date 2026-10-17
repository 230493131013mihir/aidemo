const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MandiProfile = sequelize.define(
    "MandiProfile",
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            field: "user_id"
        },
        mandiName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "mandi_name"
        },
        licenseNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "license_number"
        },
        district: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "Pune"
        },
        state: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "Maharashtra"
        },
        operatingDays: {
            type: DataTypes.STRING(100),
            defaultValue: "Mon-Sat",
            field: "operating_days"
        },
        contactPhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "contact_phone"
        },
        contactEmail: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "contact_email"
        },
        facilities: {
            type: DataTypes.STRING(255),
            defaultValue: "Weighbridge, Cold Storage, Electronic Auction, Direct Payment",
            field: "facilities"
        }
    },
    { tableName: "mandi_profiles", underscored: true }
);

module.exports = MandiProfile;
