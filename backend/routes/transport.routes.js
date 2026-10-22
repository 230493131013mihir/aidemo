const express = require("express");
const { Op } = require("sequelize");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const { TransportRequest, User, TransporterProfile } = require("../models");
const sequelize = require("../config/database");

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
    if (weightKg > 5000) {
        return { error: "Overload dispatch prevented: weightKg exceeds maximum single vehicle limit of 5000 kg" };
    }
    const pickupDate = String(body.pickupDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || Number.isNaN(Date.parse(`${pickupDate}T00:00:00Z`))) {
        return { error: "pickupDate must use YYYY-MM-DD format" };
    }

    const estimatedSharedCost = body.estimatedSharedCost
        ? Number(body.estimatedSharedCost)
        : Math.max(500, Math.round((weightKg / 1000) * 1800));

    // Generate official digital gate pass code for Maharashtra APMC
    const gatePassCode = `MH-APMC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Estimate duration in minutes based on destination
    const dest = String(body.destinationMarket).toLowerCase();
    let estimatedDurationMinutes = 120;
    if (dest.includes("mumbai") || dest.includes("vashi")) estimatedDurationMinutes = 210;
    else if (dest.includes("nagpur")) estimatedDurationMinutes = 660;
    else if (dest.includes("nashik") || dest.includes("lasalgaon")) estimatedDurationMinutes = 240;
    else if (dest.includes("kolhapur") || dest.includes("solapur")) estimatedDurationMinutes = 270;
    else if (dest.includes("pune")) estimatedDurationMinutes = 90;

    return {
        fields: {
            farmerName: String(body.farmerName).trim(),
            farmerPhone: reqUser?.role === "farmer"
                ? (body.farmerPhone ? String(body.farmerPhone).trim() : (reqUser?.phone || null))
                : null,
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

// Import public telemetry handlers for Live Driver GPS & Highway Telemetry Radar
const { handleGetTelemetry, handleUpdateTelemetry } = require("../controllers/transportController");

// Public live telemetry endpoints (accessible for real-time radar polling without auth block)
router.get("/telemetry", handleGetTelemetry);
router.get("/telemetry/:passCode", handleGetTelemetry);
router.post("/telemetry/update", handleUpdateTelemetry);

router.use(authMiddleware);

// Ensure transport columns introduced after the original table exists on older databases too.
let transportSchemaReady;
async function ensureTransportSchema() {
    if (!transportSchemaReady) {
        transportSchemaReady = (async () => {
            const queryInterface = sequelize.getQueryInterface();
            const columns = await queryInterface.describeTable("transport_requests");
            const requiredColumns = {
                transporter_id: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                farmer_phone: { type: sequelize.Sequelize.STRING(32), allowNull: true },
                driver_name: { type: sequelize.Sequelize.STRING(120), allowNull: true },
                driver_phone: { type: sequelize.Sequelize.STRING(32), allowNull: true },
                vehicle_type: { type: sequelize.Sequelize.STRING(100), allowNull: true },
                vehicle_number: { type: sequelize.Sequelize.STRING(64), allowNull: true },
                estimated_duration_minutes: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                trip_start_time: { type: sequelize.Sequelize.DATE, allowNull: true },
                estimated_shared_cost: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                gate_pass_code: { type: sequelize.Sequelize.STRING(64), allowNull: true }
            };
            for (const [column, definition] of Object.entries(requiredColumns)) {
                if (!columns[column]) await queryInterface.addColumn("transport_requests", column, definition);
            }
        })().catch((error) => {
            transportSchemaReady = null;
            throw error;
        });
    }
    return transportSchemaReady;
}

function requireRole(...roles) {
    return (req, res, next) => roles.includes(req.user?.role)
        ? next()
        : res.status(403).json({ success: false, message: "This action is not available for your account role." });
}

async function getTransporterWhereCondition(user) {
    const profile = await TransporterProfile.findOne({ where: { userId: user.id } });
    const orList = [{ transporterId: user.id }];
    if (user.name) {
        orList.push({ driverName: { [Op.like]: `%${user.name.trim()}%` } });
    }
    if (profile?.driverName) {
        orList.push({ driverName: { [Op.like]: `%${profile.driverName.trim()}%` } });
    }
    if (profile?.phone) {
        orList.push({ driverPhone: profile.phone.trim() });
    }
    return { [Op.or]: orList };
}

// Get only requests created by this farmer or assigned to this transporter.
router.get("/my-requests", requireRole("farmer", "transporter"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const whereCondition = req.user.role === "transporter"
            ? await getTransporterWhereCondition(req.user)
            : { userId: req.user.id };

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
router.post("/requests", requireRole("farmer"), async (req, res) => {
    const { fields, error } = normalizeTransportInput(req.body, req.user);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        await ensureTransportSchema();
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

// A farmer reserves a registered vehicle. Persist the same trip for both parties.
router.post("/bookings", requireRole("farmer"), async (req, res) => {
    const { fields, error } = normalizeTransportInput(req.body, req.user);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        await ensureTransportSchema();
        const transporterId = Number(req.body.transporterId);
        if (!Number.isInteger(transporterId) || transporterId === Number(req.user.id)) {
            return res.status(400).json({ success: false, message: "Choose a valid transporter." });
        }
        const profile = await TransporterProfile.findOne({ where: { userId: transporterId, isAvailable: true } });
        if (!profile) return res.status(404).json({ success: false, message: "This transporter is no longer available." });
        const activeTrip = await TransportRequest.findOne({ where: { transporterId, status: { [Op.in]: ["accepted", "in_transit"] } } });
        if (activeTrip) return res.status(409).json({ success: false, message: "This transporter already has an active trip." });
        if (fields.weightKg > profile.capacityKg) {
            return res.status(400).json({ success: false, message: `Vehicle capacity is ${profile.capacityKg} kg.` });
        }
        const request = await sequelize.transaction(async (transaction) => {
            const lockedProfile = await TransporterProfile.findByPk(profile.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!lockedProfile?.isAvailable) throw Object.assign(new Error("This transporter is no longer available."), { statusCode: 409 });
            const trip = await TransportRequest.create({
                ...fields,
                userId: req.user.id,
                transporterId,
                driverName: lockedProfile.driverName,
                driverPhone: lockedProfile.phone,
                vehicleType: lockedProfile.vehicleType,
                vehicleNumber: lockedProfile.vehicleNumber,
                status: "accepted",
                tripStartTime: null
            }, { transaction });
            await lockedProfile.update({ isAvailable: false }, { transaction });
            return trip;
        });
        return res.status(201).json({ success: true, data: request, message: "Vehicle booked. The booking is visible to you and the transporter." });
    } catch (err) {
        console.error("Create vehicle booking error:", err.message);
        return res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : "Unable to create transport booking" });
    }
});

// Get registered available transporters
router.get("/transporters", requireRole("farmer"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const transporters = await TransporterProfile.findAll({
            where: { isAvailable: true, userId: { [Op.ne]: req.user.id } },
            include: [{ model: User, attributes: ["id", "name"] }],
            order: [["createdAt", "DESC"]]
        });
        return res.json({ success: true, data: transporters });
    } catch (error) {
        console.error("Transporters error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load transporters" });
    }
});

// View all open requests for transporters/drivers to claim
router.get("/open-cargo", requireRole("transporter"), async (req, res) => {
    try {
        const openRequests = await TransportRequest.findAll({
            where: { status: "open", userId: { [Op.ne]: req.user.id } },
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
router.get("/active-trip", requireRole("transporter"), async (req, res) => {
    try {
        const transporterWhere = await getTransporterWhereCondition(req.user);
        const activeTrip = await TransportRequest.findOne({
            where: {
                ...transporterWhere,
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
router.get("/transporter-stats", requireRole("transporter"), async (req, res) => {
    try {
        const transporterWhere = await getTransporterWhereCondition(req.user);
        const completedTrips = await TransportRequest.findAll({
            where: {
                ...transporterWhere,
                status: { [Op.in]: ["delivered", "completed"] }
            }
        });
        const activeTrips = await TransportRequest.findAll({
            where: {
                ...transporterWhere,
                status: { [Op.in]: ["accepted", "in_transit"] }
            }
        });

        const totalTripsCompleted = completedTrips.length;
        const activeTripsCount = activeTrips.length;
        const totalCargoDeliveredKg = completedTrips.reduce((acc, r) => acc + (r.weightKg || 0), 0);
        const totalEarnings = completedTrips.reduce((acc, r) => acc + (r.estimatedSharedCost || 0), 0);

        const transporterId = req.user.id;
        const transporterProfile = await TransporterProfile.findOne({ where: { userId: transporterId } });

        return res.json({
            success: true,
            data: {
                totalTripsCompleted,
                activeTripsCount,
                totalCargoDeliveredKg,
                totalEarnings,
                vehicleType: transporterProfile?.vehicleType || "Tata 407 Agri LCV",
                vehicleNumber: transporterProfile?.vehicleNumber || "MH-12-TR-4921",
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

// Admin: List ALL transport requests across all farmers
router.get("/admin/all-requests", requireRole("admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const allRequests = await TransportRequest.findAll({
            include: [{ model: User, as: 'farmer', attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: 100
        });
        res.json({ success: true, requests: allRequests });
    } catch (err) {
        console.error("Admin all transport requests error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Driver / Transporter accepts a cargo request (Strict Single-Trip Lock)
router.put("/requests/:id/accept", requireRole("transporter"), async (req, res) => {
    try {
        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });
        if (Number(request.userId) === Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "You cannot accept your own transport request." });
        }

        if (request.status !== "open") {
            return res.status(400).json({ success: false, message: "This request has already been booked by another transporter." });
        }

        // STRICT CHECK: Transporter cannot accept if they already have an active trip!
        const transporterId = req.user.id;
        const existingActiveTrip = await TransportRequest.findOne({
            where: {
                transporterId,
                status: { [Op.in]: ["accepted", "in_transit"] }
            }
        });

        if (existingActiveTrip) {
            return res.status(400).json({
                success: false,
                message: `You already have an active trip in progress (Trip #${existingActiveTrip.id} delivering ${existingActiveTrip.cropName} to ${existingActiveTrip.destinationMarket}). You cannot accept new bookings until this cargo is delivered!`
            });
        }

        const transporterProfile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        if (!transporterProfile) return res.status(400).json({ success: false, message: "Register a vehicle before accepting farmer requests." });
        if (Number(request.weightKg) > transporterProfile.capacityKg) {
            return res.status(400).json({ success: false, message: `Your vehicle capacity is ${transporterProfile.capacityKg} kg.` });
        }
        const driverName = req.body.driverName || transporterProfile?.driverName || req.user.name || "Assigned Driver";
        const driverPhone = req.body.driverPhone || transporterProfile?.phone || req.user.phone || "9876543210";
        const vehicleType = req.body.vehicleType || transporterProfile?.vehicleType || "Mahindra Bolero Maxi Truck";
        const vehicleNumber = req.body.vehicleNumber || transporterProfile?.vehicleNumber || "MH-12-TR-4921";
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
        await transporterProfile.update({ isAvailable: false });

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
router.put("/requests/:id/progress", requireRole("transporter"), async (req, res) => {
    try {
        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });
        const profile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        const isAssigned = (request.transporterId && Number(request.transporterId) === Number(req.user.id)) ||
            (request.driverName && (request.driverName.toLowerCase().includes(req.user.name.toLowerCase()) || (profile?.driverName && request.driverName.toLowerCase().includes(profile.driverName.toLowerCase()))));
        if (!isAssigned) {
            return res.status(403).json({ success: false, message: "You can only update trips assigned to you." });
        }
        if (!request.transporterId) {
            await request.update({ transporterId: req.user.id });
        }

        const nextStatus = req.body.nextStatus || req.body.status;
        const allowed = ["in_transit", "delivered", "completed"];
        if (!nextStatus || !allowed.includes(nextStatus)) {
            return res.status(400).json({ success: false, message: `Invalid status: ${nextStatus}. Allowed: ${allowed.join(", ")}` });
        }
        const validTransition = (request.status === "accepted" && nextStatus === "in_transit") ||
            (["in_transit", "accepted"].includes(request.status) && ["delivered", "completed"].includes(nextStatus));
        if (!validTransition) return res.status(400).json({ success: false, message: `Cannot move a ${request.status} trip to ${nextStatus}.` });

        await request.update({ status: nextStatus, ...(nextStatus === "in_transit" ? { tripStartTime: new Date() } : {}) });

        // If trip is delivered or completed, reset transporter availability
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
router.post("/register-vehicle", requireRole("transporter"), async (req, res) => {
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
        if (capacityKg !== undefined && (!Number.isInteger(Number(capacityKg)) || Number(capacityKg) <= 0)) {
            return res.status(400).json({ success: false, message: "Vehicle capacity must be a positive number of kilograms." });
        }

        let profile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        if (profile) {
            const activeTrip = await TransportRequest.findOne({ where: { transporterId: req.user.id, status: { [Op.in]: ["accepted", "in_transit"] } } });
            if (activeTrip) return res.status(409).json({ success: false, message: "Finish your active trip before changing vehicle availability." });
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
        if (["delivered", "completed", "cancelled"].includes(req.body.status) && request.transporterId) {
            await TransporterProfile.update({ isAvailable: true }, { where: { userId: request.transporterId } });
        } else if (["accepted", "in_transit"].includes(req.body.status) && request.transporterId) {
            await TransporterProfile.update({ isAvailable: false }, { where: { userId: request.transporterId } });
        }
        return res.json({ success: true, data: request });
    } catch (error) {
        console.error("Update transport status error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update transport request" });
    }
});

// Public vehicle inventory contains only real registered profiles; farmers see only available vehicles.
router.get("/vehicles", requireRole("farmer"), async (req, res) => {
    try {
        const profiles = await TransporterProfile.findAll({
            where: { isAvailable: true, userId: { [Op.ne]: req.user.id } },
            include: [{ model: User, attributes: ["id", "name"] }],
            order: [["createdAt", "DESC"]]
        });
        return res.json({ success: true, data: profiles.map((profile) => ({
            id: profile.id,
            userId: profile.userId,
            driverName: profile.driverName,
            vehicleType: profile.vehicleType,
            vehicleNumber: profile.vehicleNumber,
            capacityKg: profile.capacityKg,
            baseMandi: profile.baseMandi,
            ratePerKm: profile.ratePerKm
        })) });
    } catch (error) {
        console.error("Vehicle inventory error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load vehicle availability" });
    }
});

module.exports = router;
