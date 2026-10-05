const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AdminUser = sequelize.define(
    "AdminUser",
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            field: "user_id"
        },
        displayName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "display_name"
        }
    },
    { tableName: "admin_users", underscored: true }
);

module.exports = AdminUser;