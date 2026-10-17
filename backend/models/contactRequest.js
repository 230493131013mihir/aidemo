const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ContactRequest = sequelize.define(
    "ContactRequest",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "sender_id"
        },
        senderName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "sender_name"
        },
        senderRole: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "sender_role"
        },
        senderContact: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "sender_contact"
        },
        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "receiver_id"
        },
        receiverName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "receiver_name"
        },
        receiverRole: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "receiver_role"
        },
        cropName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "crop_name"
        },
        quantityKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 100,
            field: "quantity_kg"
        },
        proposedPricePerKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "proposed_price_per_kg"
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "message"
        },
        status: {
            type: DataTypes.STRING(30),
            defaultValue: "pending",
            field: "status" // 'pending', 'accepted', 'declined'
        },
        contactType: {
            type: DataTypes.STRING(50),
            defaultValue: "mandi_to_farmer",
            field: "contact_type" // 'mandi_to_farmer' or 'farmer_to_mandi'
        }
    },
    { tableName: "contact_requests", underscored: true, timestamps: true }
);

module.exports = ContactRequest;
