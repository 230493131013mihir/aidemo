const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransportRequest = sequelize.define(
    "TransportRequest",
    {
        userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
        transporterId: { type: DataTypes.INTEGER, allowNull: true, field: "transporter_id" },
        vehicleId: { type: DataTypes.INTEGER, allowNull: true, field: "vehicle_id" },
        sharedTripId: { type: DataTypes.INTEGER, allowNull: true, field: "shared_trip_id" },
        bookingId: { type: DataTypes.STRING(64), allowNull: true, field: "booking_id" },
        farmerName: { type: DataTypes.STRING(120), allowNull: false, field: "farmer_name" },
        farmerPhone: { type: DataTypes.STRING(32), allowNull: true, field: "farmer_phone" },
        driverName: { type: DataTypes.STRING(120), allowNull: true, field: "driver_name" },
        driverPhone: { type: DataTypes.STRING(32), allowNull: true, field: "driver_phone" },
        cropName: { type: DataTypes.STRING(100), allowNull: false, field: "crop_name" },
        cropCategory: { type: DataTypes.STRING(64), allowNull: true, field: "crop_category" },
        pickupLocation: { type: DataTypes.STRING(160), allowNull: false, field: "pickup_location" },
        destinationMarket: { type: DataTypes.STRING(160), allowNull: false, field: "destination_market" },
        pickupDate: { type: DataTypes.DATEONLY, allowNull: false, field: "pickup_date" },
        preferredDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true, field: "preferred_delivery_date" },
        weightKg: { type: DataTypes.INTEGER, allowNull: false, field: "weight_kg" },
        quantityUnit: { type: DataTypes.STRING(32), defaultValue: "kg", field: "quantity_unit" },
        originalQuantity: { type: DataTypes.FLOAT, allowNull: true, field: "original_quantity" },
        bookingType: { type: DataTypes.STRING(32), defaultValue: "individual", field: "booking_type" },
        sharingFarmersCount: { type: DataTypes.INTEGER, defaultValue: 1, field: "sharing_farmers_count" },
        vehicleType: {
            type: DataTypes.STRING(100),
            defaultValue: "any",
            field: "vehicle_type"
        },
        vehicleNumber: { type: DataTypes.STRING(64), allowNull: true, field: "vehicle_number" },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: "pending",
            validate: {
                isIn: [[
                    "open",
                    "pending",
                    "matched",
                    "confirmed",
                    "accepted",
                    "driver_assigned",
                    "vehicle_assigned",
                    "in_transit",
                    "delivered",
                    "completed",
                    "cancelled",
                    "rejected"
                ]]
            }
        },
        rejectionReason: { type: DataTypes.TEXT, allowNull: true, field: "rejection_reason" },
        cancellationReason: { type: DataTypes.TEXT, allowNull: true, field: "cancellation_reason" },
        estimatedDurationMinutes: {
            type: DataTypes.INTEGER,
            defaultValue: 150,
            field: "estimated_duration_minutes"
        },
        tripStartTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "trip_start_time"
        },
        estimatedSharedCost: { type: DataTypes.INTEGER, field: "estimated_shared_cost" },
        finalCost: { type: DataTypes.INTEGER, allowNull: true, field: "final_cost" },
        gatePassCode: { type: DataTypes.STRING(64), allowNull: true, field: "gate_pass_code" }
    },
    { tableName: "transport_requests", underscored: true }
);

TransportRequest.STATUSES = {
    OPEN: "open",
    PENDING: "pending",
    MATCHED: "matched",
    CONFIRMED: "confirmed",
    ACCEPTED: "accepted",
    DRIVER_ASSIGNED: "driver_assigned",
    VEHICLE_ASSIGNED: "vehicle_assigned",
    IN_TRANSIT: "in_transit",
    DELIVERED: "delivered",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    REJECTED: "rejected"
};

module.exports = TransportRequest;
