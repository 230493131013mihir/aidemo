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
                    "request_received",
                    "matched",
                    "confirmed",
                    "accepted",
                    "driver_assigned",
                    "vehicle_assigned",
                    "awaiting_pickup",
                    "pickup_confirmed",
                    "in_transit",
                    "arrived_destination",
                    "delivered",
                    "delivery_confirmed",
                    "completed",
                    "cancelled",
                    "rejected",
                    "delayed",
                    "failed_delivery"
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
        actualPickupTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "actual_pickup_time"
        },
        actualDeliveryTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "actual_delivery_time"
        },
        scheduledDepartureTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "scheduled_departure_time"
        },
        actualDepartureTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "actual_departure_time"
        },
        loadedQuantity: {
            type: DataTypes.FLOAT,
            allowNull: true,
            field: "loaded_quantity"
        },
        deliveredQuantity: {
            type: DataTypes.FLOAT,
            allowNull: true,
            field: "delivered_quantity"
        },
        pickupNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "pickup_notes"
        },
        deliveryNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "delivery_notes"
        },
        statusHistory: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "status_history"
        },
        estimatedSharedCost: { type: DataTypes.INTEGER, field: "estimated_shared_cost" },
        finalCost: { type: DataTypes.INTEGER, allowNull: true, field: "final_cost" },
        gatePassCode: { type: DataTypes.STRING(64), allowNull: true, field: "gate_pass_code" },
        paymentStatus: {
            type: DataTypes.STRING(32),
            defaultValue: "unpaid",
            field: "payment_status"
        },
        escrowAmount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "escrow_amount"
        },
        driverRating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "driver_rating"
        },
        driverReview: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "driver_review"
        }
    },
    { tableName: "transport_requests", underscored: true }
);

TransportRequest.STATUSES = {
    OPEN: "open",
    PENDING: "pending",
    REQUEST_RECEIVED: "request_received",
    MATCHED: "matched",
    CONFIRMED: "confirmed",
    ACCEPTED: "accepted",
    DRIVER_ASSIGNED: "driver_assigned",
    VEHICLE_ASSIGNED: "vehicle_assigned",
    AWAITING_PICKUP: "awaiting_pickup",
    PICKUP_CONFIRMED: "pickup_confirmed",
    IN_TRANSIT: "in_transit",
    ARRIVED_DESTINATION: "arrived_destination",
    DELIVERED: "delivered",
    DELIVERY_CONFIRMED: "delivery_confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    REJECTED: "rejected",
    DELAYED: "delayed",
    FAILED_DELIVERY: "failed_delivery"
};

module.exports = TransportRequest;
