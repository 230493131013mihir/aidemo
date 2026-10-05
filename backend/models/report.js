const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Report = sequelize.define(
    "Report",
    {
        userId: { type: DataTypes.INTEGER, allowNull: true, field: "user_id" },
        category: { type: DataTypes.STRING(80), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        status: {
            type: DataTypes.ENUM("open", "reviewed", "resolved"),
            allowNull: false,
            defaultValue: "open"
        }
    },
    { tableName: "reports", underscored: true }
);

module.exports = Report;