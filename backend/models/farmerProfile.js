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
        },
        agristackId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "agristack_id"
        },
        isGovtVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "is_govt_verified"
        },
        govtVerifiedLandAcres: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            field: "govt_verified_land_acres"
        },
        surveyNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "survey_number"
        },
        aadhaarLinked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "aadhaar_linked"
        },
        dbtAccountLinked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "dbt_account_linked"
        },
        fpoName: {
            type: DataTypes.STRING(200),
            allowNull: true,
            field: "fpo_name"
        },
        fpoRegistrationNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "fpo_registration_number"
        },
        memberFarmerCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "member_farmer_count"
        },
        roleSubtype: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "role_subtype"
        }
    },
    { tableName: "farmer_profiles", underscored: true }
);

module.exports = FarmerProfile;