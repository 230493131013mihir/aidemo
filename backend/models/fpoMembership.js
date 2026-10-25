const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FpoMembership = sequelize.define(
    "FpoMembership",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        fpoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "fpo_id"
        },
        farmerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "farmer_id"
        },
        status: {
            type: DataTypes.STRING(30),
            defaultValue: "pending", // 'pending', 'active', 'inactive', 'rejected'
            field: "status"
        },
        invitedBy: {
            type: DataTypes.STRING(20),
            defaultValue: "fpo", // 'fpo' or 'farmer'
            field: "invited_by"
        },
        consentShareCrops: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "consent_share_crops"
        },
        consentShareContact: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: "consent_share_contact"
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "notes"
        },
        joinedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "joined_at"
        }
    },
    {
        tableName: "fpo_memberships",
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["fpo_id", "farmer_id"],
                name: "unique_fpo_farmer_membership"
            }
        ]
    }
);

module.exports = FpoMembership;
