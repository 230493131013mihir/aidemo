const express = require("express");
const { Op } = require("sequelize");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const { TransportRequest, User, TransporterProfile } = require("../models");

const router = express.Router();

function normalizeTransportInput(body, reqUser = {}) {
    const required = ["farmerName", "cropName", "pickupLocation", "destinationMarket", "pickupDate", "weightKg"];
    for (const key of required) {
        if (body[key] === undefined || body[key] === "") {
            return { error: `${key} is required` };
        }
    }

    const weightKg = Number(body.weightKg);
    if (!Number.isInteger(weightKg) || weightKg <= 0) {
        return { error: "weightKg must be a positive integer" };
    }
    const pickupDate = String(body.pickupDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || Number.isNaN(Date.parse(`${pickupDate}T00:00:00Z`))) {
        return { error: "pickupDate must use YYYY-MM-DD format" };
    }

    const estimatedSharedCost = body.estimatedSharedCost
        ? Number(body.estimatedSharedCost)
        : Math.max(500, Math.round((weightKg / 1000) * 1800));

    // Generate official digital gate pass code
    const gatePassCode = `GJ-APMC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Estimate duration in minutes based on destination
    const dest = String(body.destinationMarket).toLowerCase();
    let estimatedDurationMinutes = 120;
    if (dest.includes("ahmedabad")) estimatedDurationMinutes = 240;
    else if (dest.includes("mumbai") || dest.includes("vashi")) estimatedDurationMinutes = 360;
    else if (dest.includes("pune")) estimatedDurationMinutes = 420;
    else if (dest.includes("rajkot")) estimatedDurationMinutes = 300;
    else if (dest.includes("surat")) estimatedDurationMinutes = 90;

    return {
        fields: {
            farmerName: String(body.farmerName).trim(),
            farmerPhone: body.farmerPhone ? String(body.farmerPhone).trim() : (reqUser?.phone || "9999999991"),
            driverName: body.driverName ? String(body.driverName).trim() : null,
            driverPhone: body.driverPhone ? String(body.driverPhone).trim() : null,
            cropName: String(body.cropName).trim(),
            pickupLocation: String(body.pickupLocation).trim(),
            destinationMarket: String(body.destinationMarket).trim(),
            pickupDate,
            weightKg,
            vehicleType: body.vehicleType || "any",
            vehicleNumber: body.vehicleNumber ? String(body.vehicleNumber).trim().toUpperCase() : null,
            estimatedSharedCost,
            estimatedDurationMinutes,
            gatePassCode,
            status: "open"
        }
    };
}

router.use(authMiddleware);

// Get logged-in user's transport requests (Farmer bookings or Transporter assigned trips)
router.get("/my-requests", async (req, res) => {
    try {
        let whereCondition = { userId: req.user.id };
        if (req.user.role === "transporter") {
            whereCondition = {
                [Op.or]: [{ userId: req.user.id }, { transporterId: req.user.id }]
            };
        }

        const data = await TransportRequest.findAll({
            where: whereCondition,
            order: [["createdAt", "DESC"]]
        });
        return res.json({ success: true, data });
    } catch (error) {
        console.error("My transport requests error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load transport requests" });
    }
});

// Create new transport request (saves to MySQL and issues Digital Mandi Gate Pass)
router.post("/requests", async (req, res) => {
    const { fields, error } = normalizeTransportInput(req.body, req.user);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        const request = await TransportRequest.create({ ...fields, userId: req.user.id });
        return res.status(201).json({
            success: true,
            data: request,
            gatePassCode: request.gatePassCode,
            message: "Transport booking saved in MySQL! Digital APMC Gate Pass generated."
        });
    } catch (err) {
        console.error("Create transport request error:", err.message);
        return res.status(500).json({ success: false, message: "Unable to create transport request" });
    }
});

// Get registered available transporters
router.get("/transporters", async (req, res) => {
    try {
        const transporters = await TransporterProfile.findAll({
            where: { isAvailable: true },
            include: [{ model: User, attributes: ["id", "name", "email", "phone"] }],
            order: [["createdAt", "DESC"]]
        });
        return res.json({ success: true, data: transporters });
    } catch (error) {
        console.error("Transporters error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load transporters" });
    }
});

// View all open requests for transporters/drivers to claim
router.get("/open-cargo", async (req, res) => {
    try {
        const openRequests = await TransportRequest.findAll({
            where: { status: "open" },
            order: [["createdAt", "DESC"]],
            limit: 50
        });
        return res.json({ success: true, data: openRequests });
    } catch (error) {
        console.error("Open cargo error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load open cargo" });
    }
});

// Check if logged-in transporter has an active trip in progress
router.get("/active-trip", async (req, res) => {
    try {
        const activeTrip = await TransportRequest.findOne({
            where: {
                transporterId: req.user.id,
                status: { [Op.in]: ["accepted", "in_transit"] }
            },
            order: [["updatedAt", "DESC"]]
        });
        return res.json({
            success: true,
            hasActiveTrip: Boolean(activeTrip),
            activeTrip: activeTrip || null
        });
    } catch (error) {
        console.error("Active trip error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch active trip" });
    }
});

// Transporter statistics for dashboard
router.get("/transporter-stats", async (req, res) => {
    try {
        const completedTrips = await TransportRequest.findAll({
            where: {
                transporterId: req.user.id,
                status: { [Op.in]: ["delivered", "completed"] }
            }
        });
        const activeTrips = await TransportRequest.findAll({
            where: {
                transporterId: req.user.id,
                status: { [Op.in]: ["accepted", "in_transit"] }
            }
        });

        const totalTripsCompleted = completedTrips.length;
        const activeTripsCount = activeTrips.length;
        const totalCargoDeliveredKg = completedTrips.reduce((acc, r) => acc + (r.weightKg || 0), 0);
        const totalEarnings = completedTrips.reduce((acc, r) => acc + (r.estimatedSharedCost || 0), 0);

        const transporterProfile = await TransporterProfile.findOne({ where: { userId: req.user.id } });

        return res.json({
            success: true,
            data: {
                totalTripsCompleted,
                activeTripsCount,
                totalCargoDeliveredKg,
                totalEarnings,
                vehicleType: transporterProfile?.vehicleType || "Mahindra Bolero Maxi Truck",
                vehicleNumber: transporterProfile?.vehicleNumber || "GJ-05-BX-4921",
                capacityKg: transporterProfile?.capacityKg || 2200,
                isAvailable: activeTripsCount === 0,
                activeTrip: activeTrips[0] || null
            }
        });
    } catch (error) {
        console.error("Transporter stats error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load transporter stats" });
    }
});

// Driver / Transporter accepts a cargo request (Strict Single-Trip Lock)
router.put("/requests/:id/accept", async (req, res) => {
    try {
        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        if (request.status !== "open") {
            return res.status(400).json({ success: false, message: "This request has already been booked by another transporter." });
        }

        // STRICT CHECK: Transporter cannot accept if they already have an active trip!
        const existingActiveTrip = await TransportRequest.findOne({
            where: {
                transporterId: req.user.id,
                status: { [Op.in]: ["accepted", "in_transit"] }
            }
        });

        if (existingActiveTrip) {
            return res.status(409).json({
                success: false,
                message: `You already have an active trip in progress (Trip #${existingActiveTrip.id} delivering ${existingActiveTrip.cropName} to ${existingActiveTrip.destinationMarket}). You cannot accept new bookings until this cargo is delivered!`
            });
        }

        const transporterProfile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        const driverName = req.body.driverName || transporterProfile?.driverName || req.user.name || "Assigned Driver";
        const driverPhone = req.body.driverPhone || transporterProfile?.phone || req.user.phone || "9876543210";
        const vehicleType = req.body.vehicleType || transporterProfile?.vehicleType || "Mahindra Bolero Maxi Truck";
        const vehicleNumber = req.body.vehicleNumber || transporterProfile?.vehicleNumber || "GJ-05-BX-4921";
        const estimatedDurationMinutes = req.body.estimatedDurationMinutes || request.estimatedDurationMinutes || 150;

        await request.update({
            status: "accepted",
            transporterId: req.user.id,
            driverName,
            driverPhone,
            vehicleType,
            vehicleNumber,
            estimatedDurationMinutes,
            tripStartTime: new Date()
        });

        if (transporterProfile) {
            await transporterProfile.update({ isAvailable: false });
        }

        return res.json({
            success: true,
            data: request,
            message: `Trip accepted! Driver ${driverName} assigned with ${vehicleNumber}. Travel time: ${Math.round(estimatedDurationMinutes / 60)} hrs ${estimatedDurationMinutes % 60} mins.`
        });
    } catch (error) {
        console.error("Accept cargo error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to accept cargo request" });
    }
});

// Update trip status progression (accepted -> in_transit -> delivered)
router.put("/requests/:id/progress", async (req, res) => {
    try {
        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        const { nextStatus } = req.body;
        const allowed = ["in_transit", "delivered", "completed"];
        if (!allowed.includes(nextStatus)) {
            return res.status(400).json({ success: false, message: `Invalid status: ${nextStatus}. Allowed: ${allowed.join(", ")}` });
        }

        await request.update({ status: nextStatus });

        // If trip is delivered or completed, free up the transporter
        if (["delivered", "completed"].includes(nextStatus)) {
            if (request.transporterId) {
                await TransporterProfile.update(
                    { isAvailable: true },
                    { where: { userId: request.transporterId } }
                );
            }
        }

        return res.json({
            success: true,
            data: request,
            message: `Trip status progressed to ${nextStatus.toUpperCase()}! Farmer will see live update.`
        });
    } catch (error) {
        console.error("Progress trip error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update trip progress" });
    }
});

// Register or update vehicle details for logged-in user
router.post("/register-vehicle", async (req, res) => {
    try {
        const {
            driverName,
            phone,
            vehicleType,
            vehicleNumber,
            capacityKg,
            baseMandi,
            ratePerKm
        } = req.body;

        if (!driverName || !vehicleNumber) {
            return res.status(400).json({ success: false, message: "Driver name and vehicle number are required." });
        }

        let profile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        if (profile) {
            await profile.update({
                driverName: driverName.trim(),
                phone: phone ? phone.trim() : req.user.phone,
                vehicleType: vehicleType || profile.vehicleType,
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                capacityKg: capacityKg ? Number(capacityKg) : profile.capacityKg,
                baseMandi: baseMandi || profile.baseMandi,
                ratePerKm: ratePerKm ? Number(ratePerKm) : profile.ratePerKm,
                isAvailable: true
            });
        } else {
            profile = await TransporterProfile.create({
                userId: req.user.id,
                driverName: driverName.trim(),
                phone: phone ? phone.trim() : req.user.phone || "9876543210",
                vehicleType: vehicleType || "Mahindra Bolero Maxi",
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                capacityKg: capacityKg ? Number(capacityKg) : 2000,
                baseMandi: baseMandi || "Surat APMC",
                ratePerKm: ratePerKm ? Number(ratePerKm) : 25,
                isAvailable: true
            });
        }

        // Also update user's role to transporter if not already
        await User.update({ role: "transporter" }, { where: { id: req.user.id } });

        return res.json({
            success: true,
            data: profile,
            message: "Vehicle registered successfully! You can now accept farm loads."
        });
    } catch (error) {
        console.error("Register vehicle error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Failed to register vehicle" });
    }
});

// Admin endpoints
router.get("/requests", adminMiddleware, async (req, res) => {
    try {
        const data = await TransportRequest.findAll({
            include: [{ model: User, attributes: ["id", "name", "email", "phone"] }],
            order: [["createdAt", "DESC"]],
            limit: 200
        });
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Admin transport requests error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load transport requests" });
    }
});

router.put("/requests/:id/status", adminMiddleware, async (req, res) => {
    try {
        const allowed = ["open", "matched", "accepted", "in_transit", "delivered", "completed", "cancelled"];
        if (!allowed.includes(req.body.status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Transport request not found" });
        await request.update({ status: req.body.status });
        return res.json({ success: true, data: request });
    } catch (error) {
        console.error("Update transport status error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update transport request" });
    }
});

module.exports = router;
