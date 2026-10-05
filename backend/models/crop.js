const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Crop = sequelize.define(
    "Crop",
    {
        nameEn: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "name_en" },
        nameGu: { type: DataTypes.STRING(100), allowNull: false, field: "name_gu" },
        nameHi: { type: DataTypes.STRING(100), allowNull: false, field: "name_hi" },
        category: {
            type: DataTypes.ENUM("vegetable", "grain", "fruit", "pulse", "oilseed"),
            defaultValue: "vegetable"
        },
        shelfLifeDays: { type: DataTypes.INTEGER, defaultValue: 3, field: "shelf_life_days" }
    },
    { tableName: "crops", underscored: true }
);

module.exports = Crop;
