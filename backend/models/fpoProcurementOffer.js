const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FpoProcurementOffer = sequelize.define(
    "FpoProcurementOffer",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        offerCode: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            field: "offer_code"
        },
        aggregationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "aggregation_id"
        },
        fpoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "fpo_id"
        },
        mandiId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "mandi_id"
        },
        mandiName: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "mandi_name"
        },
        cropName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "crop_name"
        },
        totalQuantityKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: "total_quantity_kg"
        },
        requestedRatePerKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: "requested_rate_per_kg"
        },
        quotedRatePerKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "quoted_rate_per_kg"
        },
        agreedRatePerKg: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: "agreed_rate_per_kg"
        },
        expectedDeliveryDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "expected_delivery_date"
        },
        status: {
            type: DataTypes.STRING(40),
            defaultValue: "awaiting_mandi_response",
            // 'draft', 'awaiting_mandi_response', 'quotation_received', 'awaiting_fpo_confirmation',
            // 'confirmed', 'rejected', 'withdrawn', 'delivery_scheduled', 'delivered', 'completed'
            field: "status"
        },
        transportRequestId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "transport_request_id"
        },
        mandiNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "mandi_notes"
        },
        fpoNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "fpo_notes"
        },
        settlementAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            field: "settlement_amount"
        },
        settlementStatus: {
            type: DataTypes.STRING(30),
            defaultValue: "unsettled", // 'unsettled', 'partial', 'settled'
            field: "settlement_status"
        },
        history: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "history"
        }
    },
    {
        tableName: "fpo_procurement_offers",
        underscored: true,
        timestamps: true
    }
);

module.exports = FpoProcurementOffer;
