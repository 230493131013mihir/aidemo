const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define(
    "AuditLog",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        actorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "actor_id"
        },
        actorName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "actor_name"
        },
        actorEmail: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "actor_email"
        },
        action: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        targetType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "target_type"
        },
        targetId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "target_id"
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ipAddress: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "ip_address"
        }
    },
    {
        tableName: "audit_logs",
        underscored: true,
        timestamps: true
    }
);

module.exports = AuditLog;
