const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false
        },

        role: {
            type: DataTypes.ENUM("farmer", "admin"),
            defaultValue: "farmer"
        }
    },
    {
        tableName: "users",
        timestamps: true
    }
);

module.exports = User;