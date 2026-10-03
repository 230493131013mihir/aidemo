const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Market = sequelize.define(
    "Market",
    {
        name: { type: DataTypes.STRING(100), allowNull: false },
        district: { type: DataTypes.STRING(100), allowNull: false },
        state: { type: DataTypes.STRING(100), allowNull: false },
        distanceFromSuratKm: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0,
            field: "distance_from_surat_km"
        },
        operatingDays: {
            type: DataTypes.STRING(100),
            defaultValue: "Mon-Sat",
            field: "operating_days"
        }
    },
    { tableName: "markets", underscored: true }
);

module.exports = Market;