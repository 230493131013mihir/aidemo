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
            allowNull: false,
            defaultValue: "Pune"
        },
        state: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "Maharashtra"
        },
        village: DataTypes.STRING(100),
        farmSizeAcres: {
            type: DataTypes.DECIMAL(5, 2),
            field: "farm_size_acres"
        },
        mainCrop: {
            type: DataTypes.STRING(255),
            defaultValue: "Tomato",
            field: "main_crop"
        },
        customCrop: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "custom_crop"
        },
        currentHarvestKg: {
            type: DataTypes.INTEGER,
            defaultValue: 500,
            field: "current_harvest_kg"
        },
        productQuantities: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "product_quantities"
        },
        preferredLanguage: {
            type: DataTypes.STRING(20),
            defaultValue: "en",
            field: "preferred_language"
        }
    },
    { tableName: "farmer_profiles", underscored: true }
);

module.exports = FarmerProfile;