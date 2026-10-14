const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FarmerProfile = sequelize.define(
    "FarmerProfile",
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            field: "user_id"
        },
        district: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        state: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "Gujarat"
        },
        village: DataTypes.STRING(100),
        farmSizeAcres: {
            type: DataTypes.DECIMAL(5, 2),
            field: "farm_size_acres"
        },
        mainCrop: {
            type: DataTypes.STRING(100),
            defaultValue: "Tomato",
            field: "main_crop"
        },
        currentHarvestKg: {
            type: DataTypes.INTEGER,
            defaultValue: 500,
            field: "current_harvest_kg"
        },
        preferredLanguage: {
            type: DataTypes.ENUM("en", "gu", "hi"),
            defaultValue: "en",
            field: "preferred_language"
        }
    },
    { tableName: "farmer_profiles", underscored: true }
);

module.exports = FarmerProfile;