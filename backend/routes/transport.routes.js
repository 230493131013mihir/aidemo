const express = require("express");
const { Op } = require("sequelize");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const { TransportRequest, User, TransporterProfile, Vehicle, SharedTrip } = require("../models");
const sequelize = require("../config/database");
const {
    convertToKg,
    convertFromKg,
    getCropProfile,
    areCropsCompatibleForSharedTransport,
    areRoutesCompatible,
    areDatesCompatible,
    calculateSharedFareAllocation,
    suggestSharedTripGroups
} = require("../services/cropTransportCompatibility");
const { findMatchingTransport, calculateSharedTransportCost } = require("../services/transportMatcher");

const ACTIVE_BOOKING_STATUSES = [
    "open",
    "pending",
    "confirmed",
    "accepted",
    "driver_assigned",
    "vehicle_assigned",
    "awaiting_pickup",
    "pickup_confirmed",
    "in_transit",
    "arrived_destination"
];

const TERMINAL_BOOKING_STATUSES = [
    "delivered",
    "delivery_confirmed",
    "completed",
    "cancelled",
    "rejected"
];

const router = express.Router();

function normalizeTransportInput(body, reqUser = {}) {
    const effectiveFarmerName = body.farmerName || reqUser?.name;
    if (!effectiveFarmerName || String(effectiveFarmerName).trim() === "") {
        return { error: "farmerName is required" };
    }
    const required = ["cropName", "pickupLocation", "destinationMarket", "pickupDate"];
    for (const key of required) {
        if (body[key] === undefined || body[key] === "") {
            return { error: `${key} is required` };
        }
    }

    const quantityUnit = String(body.quantityUnit || "kg").toLowerCase();
    const rawQty = Number(body.quantity !== undefined ? body.quantity : body.weightKg);
    if (Number.isNaN(rawQty) || rawQty <= 0) {
        return { error: "Quantity must be a positive number" };
    }
    // Convert to standard kg: 1 quintal = 100 kg, 1 tonne = 1000 kg
    const weightKg = convertToKg(rawQty, quantityUnit);
    if (weightKg <= 0 || weightKg > 5000) {
        return { error: "Weight in kg must be greater than 0 and cannot exceed 5000 kg" };
    }
    const pickupDate = String(body.pickupDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || Number.isNaN(Date.parse(`${pickupDate}T00:00:00Z`))) {
        return { error: "pickupDate must use YYYY-MM-DD format" };
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (pickupDate < todayStr) {
        return { error: "pickupDate cannot be in the past" };
    }

    const preferredDeliveryDate = body.preferredDeliveryDate ? String(body.preferredDeliveryDate) : null;

    const cropName = String(body.cropName).trim();
    const cropProfile = getCropProfile(cropName);

    const bookingType = body.bookingType === "shared" ? "shared" : "individual";
    const sharingFarmersCount = Math.max(1, Number(body.sharingFarmersCount) || 1);

    // Calculate base route rate
    const dest = String(body.destinationMarket).toLowerCase();
    let estimatedDurationMinutes = 120;
    let baseDistanceKm = 100;
    if (dest.includes("mumbai") || dest.includes("vashi")) {
        estimatedDurationMinutes = 210;
        baseDistanceKm = 165;
    } else if (dest.includes("nagpur")) {
        estimatedDurationMinutes = 660;
        baseDistanceKm = 480;
    } else if (dest.includes("nashik") || dest.includes("lasalgaon")) {
        estimatedDurationMinutes = 240;
        baseDistanceKm = 180;
    } else if (dest.includes("kolhapur") || dest.includes("solapur")) {
        estimatedDurationMinutes = 270;
        baseDistanceKm = 230;
    } else if (dest.includes("pune")) {
        estimatedDurationMinutes = 90;
        baseDistanceKm = 45;
    }

    const soloEstimatedCost = Math.max(600, Math.round(baseDistanceKm * 25));
    const estimatedSharedCost = body.estimatedSharedCost
        ? Number(body.estimatedSharedCost)
        : (bookingType === "shared"
            ? Math.max(400, Math.round((soloEstimatedCost * 0.55) * Math.max(0.4, weightKg / 1500)))
            : soloEstimatedCost);

    const bookingId = `BK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatePassCode = `MH-APMC-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
        fields: {
            bookingId,
            farmerName: String(body.farmerName || reqUser?.name || "Farmer").trim(),
            farmerPhone: (reqUser?.role === "farmer" || reqUser?.role === "fpo_leader")
                ? (body.farmerPhone ? String(body.farmerPhone).trim() : (reqUser?.phone || null))
                : (body.farmerPhone ? String(body.farmerPhone).trim() : null),
            driverName: body.driverName ? String(body.driverName).trim() : null,
            driverPhone: body.driverPhone ? String(body.driverPhone).trim() : null,
            cropName,
            cropCategory: cropProfile.category,
            pickupLocation: String(body.pickupLocation).trim(),
            destinationMarket: String(body.destinationMarket).trim(),
            pickupDate,
            preferredDeliveryDate,
            weightKg,
            quantityUnit,
            originalQuantity: rawQty,
            bookingType,
            sharingFarmersCount,
            vehicleType: body.vehicleType || "any",
            vehicleNumber: body.vehicleNumber ? String(body.vehicleNumber).trim().toUpperCase() : null,
            vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
            sharedTripId: body.sharedTripId ? Number(body.sharedTripId) : null,
            estimatedSharedCost,
            estimatedDurationMinutes,
            gatePassCode,
            status: "pending"
        }
    };
}

// Import public telemetry handlers for Live Driver GPS & Highway Telemetry Radar
const { handleGetTelemetry, handleUpdateTelemetry } = require("../controllers/transportController");

// Public live telemetry endpoints (accessible for real-time radar polling without auth block)
router.get("/telemetry", handleGetTelemetry);
router.get("/telemetry/:passCode", handleGetTelemetry);
router.post("/telemetry/update", handleUpdateTelemetry);

// Secure Gate Pass Verification (PART 9)
// Public verification returns only non-sensitive verification status
// Authorized operators (mandi, admin, assigned transporter, booking farmer) receive verified cargo & check-in details
router.get("/gatepass/verify/:code", async (req, res) => {
    try {
        const rawCode = String(req.params.code || "").trim();
        if (!rawCode) {
            return res.status(400).json({ success: false, message: "Gate pass token or code is required" });
        }

        const booking = await TransportRequest.findOne({
            where: {
                [Op.or]: [
                    { gatePassCode: rawCode },
                    { bookingId: rawCode }
                ]
            },
            include: [
                { model: Vehicle, attributes: ["registrationNumber", "vehicleType", "driverName", "driverPhone"] }
            ]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: "Gate pass record not found or token has expired."
            });
        }

        // Determine caller's identity if Authorization header was provided
        let caller = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.slice(7).trim();
            const jwt = require("jsonwebtoken");
            try {
                caller = jwt.verify(token, process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon");
            } catch (_) {}
        }

        const isAuthorizedOperator = caller && (
            caller.role === "admin" ||
            caller.role === "mandi" ||
            caller.role === "transporter" ||
            caller.id === booking.userId ||
            caller.id === booking.transporterId
        );

        // If caller is NOT an authorized operator or account owner, return minimal secure validation without private contact details
        if (!isAuthorizedOperator) {
            return res.json({
                success: true,
                valid: true,
                passId: booking.gatePassCode || booking.bookingId,
                status: booking.status,
                destinationMarket: booking.destinationMarket,
                cropName: booking.cropName,
                isAuthorized: false,
                message: "Valid electronic transit gate pass. Sign in with APMC Mandi or Transporter credentials to view weighing & check-in controls."
            });
        }

        // Return authorized operational details
        return res.json({
            success: true,
            valid: true,
            isAuthorized: true,
            data: {
                passId: booking.gatePassCode,
                bookingId: booking.bookingId,
                status: booking.status,
                farmerName: booking.farmerName,
                farmerPhone: booking.farmerPhone || "Registered on Agristack",
                cropName: booking.cropName,
                weightKg: booking.weightKg,
                quantityUnit: booking.quantityUnit || "kg",
                pickupLocation: booking.pickupLocation,
                destinationMarket: booking.destinationMarket,
                pickupDate: booking.pickupDate,
                driverName: booking.driverName || booking.Vehicle?.driverName || "Assigned Driver",
                driverPhone: booking.driverPhone || booking.Vehicle?.driverPhone || "—",
                vehicleNumber: booking.vehicleNumber || booking.Vehicle?.registrationNumber || "—",
                vehicleType: booking.vehicleType || booking.Vehicle?.vehicleType || "Commercial Freight",
                actualPickupTime: booking.actualPickupTime,
                actualDeliveryTime: booking.actualDeliveryTime,
                issuedAt: booking.createdAt
            }
        });
    } catch (err) {
        console.error("Gate pass verify error:", err.message);
        return res.status(500).json({ success: false, message: "Error verifying gate pass." });
    }
});

// Authorized Gate Operator Check-in / Arrival Action
router.post("/gatepass/checkin", async (req, res) => {
    // Requires authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Authentication required for gate check-in." });
    }
    const token = authHeader.slice(7).trim();
    const jwt = require("jsonwebtoken");
    let caller;
    try {
        caller = jwt.verify(token, process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon");
    } catch (_) {
        return res.status(401).json({ success: false, message: "Invalid or expired session." });
    }

    if (caller.role !== "admin" && caller.role !== "mandi" && caller.role !== "transporter") {
        return res.status(403).json({ success: false, message: "Access denied: Gate check-in is restricted to Mandi officials, administrators, and transporters." });
    }

    const { gatePassCode, checkInNotes, arrivalWeightKg } = req.body;
    if (!gatePassCode) {
        return res.status(400).json({ success: false, message: "gatePassCode is required." });
    }

    const booking = await TransportRequest.findOne({
        where: {
            [Op.or]: [
                { gatePassCode: String(gatePassCode).trim() },
                { bookingId: String(gatePassCode).trim() }
            ]
        }
    });

    if (!booking) {
        return res.status(404).json({ success: false, message: "Gate pass not found." });
    }

    if (booking.status === "completed" || booking.status === "delivered" || booking.status === "delivery_confirmed") {
        return res.status(400).json({
            success: false,
            message: `Consignment has already completed check-in on ${booking.actualDeliveryTime || "record"}. Duplicate check-in prevented.`
        });
    }

    const now = new Date();
    booking.actualDeliveryTime = now;
    booking.status = "arrived_destination";
    if (arrivalWeightKg) booking.deliveredQuantity = Number(arrivalWeightKg);
    if (checkInNotes) {
        booking.deliveryNotes = (booking.deliveryNotes ? `${booking.deliveryNotes}\n` : "") + `[Gate Check-in by ${caller.name}]: ${checkInNotes}`;
    }
    await booking.save();

    // Log in AuditLog if model exists
    try {
        const { AuditLog } = require("../models");
        if (AuditLog) {
            await AuditLog.create({
                actorId: caller.id,
                actorName: caller.name,
                actorRole: caller.role,
                action: "GATE_PASS_CHECKIN",
                targetType: "transport_request",
                targetId: booking.id,
                details: JSON.stringify({
                    gatePassCode: booking.gatePassCode,
                    bookingId: booking.bookingId,
                    destination: booking.destinationMarket,
                    weightKg: booking.weightKg,
                    timestamp: now.toISOString()
                })
            });
        }
    } catch (_) {}

    return res.json({
        success: true,
        message: `Arrival verified at ${booking.destinationMarket}! Consignment marked as arrived at Mandi.`,
        data: {
            bookingId: booking.bookingId,
            gatePassCode: booking.gatePassCode,
            status: booking.status,
            actualDeliveryTime: now
        }
    });
});

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
                vehicle_id: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                shared_trip_id: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                booking_id: { type: sequelize.Sequelize.STRING(64), allowNull: true },
                farmer_phone: { type: sequelize.Sequelize.STRING(32), allowNull: true },
                driver_name: { type: sequelize.Sequelize.STRING(120), allowNull: true },
                driver_phone: { type: sequelize.Sequelize.STRING(32), allowNull: true },
                crop_category: { type: sequelize.Sequelize.STRING(64), allowNull: true },
                quantity_unit: { type: sequelize.Sequelize.STRING(32), allowNull: true, defaultValue: "kg" },
                original_quantity: { type: sequelize.Sequelize.FLOAT, allowNull: true },
                preferred_delivery_date: { type: sequelize.Sequelize.DATEONLY, allowNull: true },
                booking_type: { type: sequelize.Sequelize.STRING(32), allowNull: true, defaultValue: "individual" },
                sharing_farmers_count: { type: sequelize.Sequelize.INTEGER, allowNull: true, defaultValue: 1 },
                vehicle_type: { type: sequelize.Sequelize.STRING(100), allowNull: true },
                vehicle_number: { type: sequelize.Sequelize.STRING(64), allowNull: true },
                estimated_duration_minutes: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                trip_start_time: { type: sequelize.Sequelize.DATE, allowNull: true },
                estimated_shared_cost: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                final_cost: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                gate_pass_code: { type: sequelize.Sequelize.STRING(64), allowNull: true },
                rejection_reason: { type: sequelize.Sequelize.TEXT, allowNull: true },
                cancellation_reason: { type: sequelize.Sequelize.TEXT, allowNull: true },
                payment_status: { type: sequelize.Sequelize.STRING(32), allowNull: true, defaultValue: "unpaid" },
                escrow_amount: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                driver_rating: { type: sequelize.Sequelize.INTEGER, allowNull: true },
                driver_review: { type: sequelize.Sequelize.TEXT, allowNull: true },
                actual_pickup_time: { type: sequelize.Sequelize.DATE, allowNull: true },
                actual_delivery_time: { type: sequelize.Sequelize.DATE, allowNull: true },
                loaded_quantity: { type: sequelize.Sequelize.FLOAT, allowNull: true },
                delivered_quantity: { type: sequelize.Sequelize.FLOAT, allowNull: true },
                pickup_notes: { type: sequelize.Sequelize.TEXT, allowNull: true },
                delivery_notes: { type: sequelize.Sequelize.TEXT, allowNull: true },
                status_history: { type: sequelize.Sequelize.TEXT, allowNull: true }
            };
            for (const [column, definition] of Object.entries(requiredColumns)) {
                if (!columns[column]) await queryInterface.addColumn("transport_requests", column, definition).catch(() => {});
            }
            try {
                const transporterCols = await queryInterface.describeTable("transporter_profiles").catch(() => ({}));
                if (!transporterCols.rating) await queryInterface.addColumn("transporter_profiles", "rating", { type: sequelize.Sequelize.FLOAT, allowNull: true, defaultValue: 4.8 }).catch(() => {});
                if (!transporterCols.total_ratings) await queryInterface.addColumn("transporter_profiles", "total_ratings", { type: sequelize.Sequelize.INTEGER, allowNull: true, defaultValue: 1 }).catch(() => {});
            } catch (_) {}
            try {
                await sequelize.query("ALTER TABLE transport_requests MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'pending'");
            } catch (_) {}
        })().catch((error) => {
            transportSchemaReady = null;
            throw error;
        });
    }
    return transportSchemaReady;
}

router.use(async (req, res, next) => {
    try {
        await ensureTransportSchema();
    } catch (_) {}
    next();
});

function requireRole(...roles) {
    return (req, res, next) => roles.includes(req.user?.role)
        ? next()
        : res.status(403).json({ success: false, message: "This action is not available for your account role." });
}

async function getTransporterWhereCondition(user) {
    return { transporterId: user.id };
}

async function resolveBookingUserId(user) {
    if (!user) {
        const anyUser = await User.findOne({ order: [["id", "ASC"]] });
        return anyUser ? anyUser.id : 1;
    }

    // 1. If valid user id, check if it exists in the active DB
    if (user.id && user.id !== 999999) {
        try {
            const existing = await User.findByPk(user.id);
            if (existing) return existing.id;
        } catch (_) {}
    }

    // 2. Try resolving by email
    if (user.email && user.email !== "guest@harvestmitra.local") {
        try {
            const byEmail = await User.findOne({ where: { email: user.email } });
            if (byEmail) return byEmail.id;
        } catch (_) {}
    }

    // 3. Try resolving by name
    if (user.name && user.name !== "Guest Farmer" && user.name !== "Farmer") {
        try {
            const byName = await User.findOne({ where: { name: user.name } });
            if (byName) return byName.id;
        } catch (_) {}
    }

    // 4. Auto-create/sync user in DB so foreign key constraint transport_requests_ibfk_1 never fails
    try {
        const created = await User.create({
            ...(user.id && user.id !== 999999 ? { id: user.id } : {}),
            name: user.name || "Farmer",
            email: user.email || `farmer_${Date.now()}@harvestmitra.local`,
            password: "DemoUser123!",
            role: user.role || "farmer",
            phone: user.phone || "9876543210"
        }).catch(async () => {
            return await User.create({
                name: user.name || "Farmer",
                email: `farmer_${Date.now()}_${Math.floor(Math.random() * 1000)}@harvestmitra.local`,
                password: "DemoUser123!",
                role: user.role || "farmer",
                phone: user.phone || "9876543210"
            });
        });
        if (created) return created.id;
    } catch (_) {}

    // 5. Final fallback to any valid farmer or first user in DB
    try {
        const fallback = await User.findOne({ where: { role: "farmer" } }) || await User.findOne();
        if (fallback) return fallback.id;
    } catch (_) {}

    return 1;
}


// ==============================================================================
// 1. VEHICLE INVENTORY & FLEET MANAGEMENT APIS
// ==============================================================================

/**
 * GET /api/transport/vehicles
 * List available verified vehicles with crop suitability & live remaining capacity.
 */
router.get("/vehicles", async (req, res) => {
    try {
        await ensureTransportSchema();
        const {
            crop,
            weightKg,
            quantity,
            quantityUnit,
            pickupLocation,
            destination,
            vehicleType,
            sharedOnly,
            date
        } = req.query;

        const effectiveKg = weightKg ? Number(weightKg) : (quantity ? convertToKg(quantity, quantityUnit) : 0);

        // Fetch real vehicles genuinely registered by Transporters
        const vehicles = await Vehicle.findAll({
            where: {
                isAvailable: true,
                status: "available",
                ...(req.query.excludeOwn === "true" && req.user?.id ? { userId: { [Op.ne]: req.user.id } } : {})
            },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "role"],
                    include: [
                        {
                            model: TransporterProfile,
                            attributes: ["driverName", "phone", "baseMandi", "rating", "totalRatings"]
                        }
                    ]
                }
            ],
            order: [["capacityKg", "ASC"]]
        });

        const includeDemo = req.query.includeDemo === "true";

        // Filter out vehicles that do not belong to a real verified transporter or admin account
        // And do not mix seed/demo records (transporter@harvestmitra.local) into production results unless explicitly requested
        const seenVehicleIds = new Set();
        const transporterVehicles = vehicles.filter(v => {
            if (!v.User) return false;
            if (v.User.role && v.User.role !== "transporter" && v.User.role !== "admin") return false;
            if (!includeDemo) {
                const email = String(v.User?.email || "").toLowerCase();
                if (email === "transporter@harvestmitra.local") return false;
            }
            if (seenVehicleIds.has(v.id)) return false;
            seenVehicleIds.add(v.id);
            return true;
        });
        // Determine caller identity from auth header if available
        let callerId = req.user?.id || null;
        if (!callerId) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.slice(7).trim();
                if (token && token !== "guest") {
                    const jwt = require("jsonwebtoken");
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon");
                        callerId = decoded?.id || null;
                    } catch (_) {}
                }
            }
        }

        // If specific crop requested, get its handling profile
        const cropProfile = crop ? getCropProfile(crop) : null;

        // Augment each vehicle with live booking usage, crop suitability, and rates
        const augmented = await Promise.all(transporterVehicles.map(async (v) => {
            const vehicleData = v.toJSON();

            // Calculate active ongoing bookings and assignments for this vehicle using authoritative statuses
            const activeBookings = await TransportRequest.findAll({
                where: {
                    vehicleId: v.id,
                    ...(date && date.trim() ? { pickupDate: date.trim() } : {}),
                    status: { [Op.in]: ACTIVE_BOOKING_STATUSES }
                }
            });

            const bookedWeightKg = activeBookings.reduce((sum, b) => sum + (Number(b.weightKg) || 0), 0);
            const remainingCapacityKg = Math.max(0, v.capacityKg - bookedWeightKg);
            const isFullyBooked = remainingCapacityKg <= 0;
            const isCurrentlyInTransit = activeBookings.some(b => ["in_transit", "driver_assigned"].includes(b.status));

            // Check if caller has an active booking on this vehicle
            const userActiveBooking = callerId ? activeBookings.find(b => Number(b.userId) === Number(callerId)) : null;

            // Check route compatibility if destination is provided
            let isRouteEligible = true;
            if (destination && destination.trim() && destination.toLowerCase() !== "all") {
                const destNorm = destination.trim().toLowerCase();
                const destKeywords = destNorm.split(/\s+/).filter(w => w.length > 2 && !["apmc", "market", "yard", "wholesale"].includes(w));
                const routesStr = String(v.supportedRoutes || "").toLowerCase();
                const baseLocStr = String(v.baseLocation || "").toLowerCase();
                const matchesKeyword = destKeywords.length === 0 || destKeywords.some(kw => routesStr.includes(kw) || baseLocStr.includes(kw));
                const isBroadRoute = !v.supportedRoutes || routesStr.includes("all") || routesStr.includes("any") || routesStr.includes("maharashtra") || routesStr.includes("gujarat");
                isRouteEligible = isBroadRoute || matchesKeyword || routesStr.includes(destNorm) || destNorm.includes(routesStr) || baseLocStr.includes(destNorm);
            }

            // Crop suitability & smart matching score
            let isCropSuitable = true;
            let isRecommended = false;
            let cropMatchScore = 50;
            let cropSuitabilityReason = "Standard goods transport suitable";

            if (cropProfile) {
                const supportedStr = String(v.supportedCrops || "").toLowerCase();
                const cropCategory = String(cropProfile.category || "").toLowerCase();
                const cropNameLower = String(cropProfile.name || "").toLowerCase();
                const vTypeLower = String(v.vehicleType || "").toLowerCase();

                const isSpecificallyRecommended = (cropProfile.recommendedVehicles || []).some(rv => {
                    const rvLower = rv.toLowerCase();
                    return vTypeLower.includes(rvLower) || rvLower.includes(vTypeLower);
                });

                const directCropNameMatch = supportedStr.includes(cropNameLower);
                const categoryMatch = 
                    (cropCategory.includes("vegetable") && supportedStr.includes("vegetable")) ||
                    (cropCategory.includes("grain") && (supportedStr.includes("grain") || supportedStr.includes("bulk"))) ||
                    (cropCategory.includes("oilseed") && (supportedStr.includes("oilseed") || supportedStr.includes("grain") || supportedStr.includes("bulk"))) ||
                    (cropCategory.includes("cash_crop") && (supportedStr.includes("cotton") || supportedStr.includes("commercial") || supportedStr.includes("bulk"))) ||
                    (cropCategory.includes("fruit") && supportedStr.includes("fruit"));

                if (cropCategory.includes("fruit") && !vTypeLower.includes("reefer") && !vTypeLower.includes("refrigerated") && !v.specialHandling?.toLowerCase().includes("refrigerated") && !v.specialHandling?.toLowerCase().includes("covered")) {
                    isCropSuitable = false;
                    isRecommended = false;
                    cropMatchScore = 10;
                    cropSuitabilityReason = "Delicate fruit requires covered/refrigerated carrier";
                } else if (cropCategory.includes("cash_crop") && vTypeLower.includes("mini") && !vTypeLower.includes("large") && !vTypeLower.includes("medium")) {
                    isCropSuitable = false;
                    isRecommended = false;
                    cropMatchScore = 15;
                    cropSuitabilityReason = "Cotton bulk bales require High-Side Medium or Large Goods Truck";
                } else if (isSpecificallyRecommended || directCropNameMatch) {
                    isCropSuitable = true;
                    isRecommended = true;
                    cropMatchScore = 100;
                    cropSuitabilityReason = `Verified match: ${cropProfile.specialHandling || 'Recommended for ' + cropProfile.name}`;
                } else if (categoryMatch) {
                    isCropSuitable = true;
                    isRecommended = true;
                    cropMatchScore = 80;
                    cropSuitabilityReason = `Category match: ${cropProfile.specialHandling || 'Suitable for ' + cropCategory}`;
                } else if (cropCategory.includes("general_cargo") || cropNameLower === "other" || cropNameLower === "other crops") {
                    isCropSuitable = true;
                    isRecommended = true;
                    cropMatchScore = 75;
                    cropSuitabilityReason = "Agri-logistics cargo bed suitable";
                } else {
                    isCropSuitable = true;
                    isRecommended = false;
                    cropMatchScore = 40;
                    cropSuitabilityReason = "General cargo suitable (standard haulage)";
                }
            }

            // Estimate base distance & fare from real vehicle ratePerKm
            const destStr = String(destination || "Vashi APMC").toLowerCase();
            let distanceKm = 100;
            if (destStr.includes("mumbai") || destStr.includes("vashi")) distanceKm = 165;
            else if (destStr.includes("pune")) distanceKm = 45;
            else if (destStr.includes("nashik")) distanceKm = 180;
            else if (destStr.includes("solapur")) distanceKm = 240;

            const ratePerKm = v.ratePerKm || 22;
            const estimatedSoloFare = Math.max(400, Math.round(distanceKm * ratePerKm));
            const cargoWeight = effectiveKg > 0 ? effectiveKg : Math.min(500, v.capacityKg);
            const sharedProportion = Math.max(0.35, Math.min(0.9, cargoWeight / v.capacityKg));
            const estimatedSharedFare = Math.max(250, Math.round(estimatedSoloFare * sharedProportion));

            return {
                ...vehicleData,
                transporterId: v.userId,
                transporterName: v.User?.name || v.driverName,
                totalCapacityKg: v.capacityKg,
                bookedWeightKg,
                remainingCapacityKg,
                isFullyBooked,
                isBookedByCurrentUser: Boolean(userActiveBooking),
                userActiveBooking: userActiveBooking ? {
                    id: userActiveBooking.id,
                    bookingId: userActiveBooking.bookingId,
                    status: userActiveBooking.status,
                    weightKg: userActiveBooking.weightKg,
                    cropName: userActiveBooking.cropName,
                    pickupDate: userActiveBooking.pickupDate,
                    pickupLocation: userActiveBooking.pickupLocation,
                    destinationMarket: userActiveBooking.destinationMarket
                } : null,
                isCurrentlyInTransit,
                isRouteEligible,
                isCropSuitable,
                isRecommended,
                cropMatchScore,
                cropSuitabilityReason,
                estimatedSoloFare,
                estimatedSharedFare,
                estimatedDurationMinutes: distanceKm > 100 ? 210 : 90,
                canAccommodateCargo: !isFullyBooked && !userActiveBooking && (effectiveKg > 0 ? (remainingCapacityKg >= effectiveKg) : (remainingCapacityKg > 0)),
                hasActiveSharedPool: activeBookings.length > 0,
                activeBookingsCount: activeBookings.length
            };
        }));

        // Apply filters: must not be in transit and must be route eligible
        let result = augmented.filter(v => !v.isCurrentlyInTransit && v.isRouteEligible);

        if (req.query.availableOnly === "true") {
            result = result.filter(v => v.remainingCapacityKg > 0 && !v.isBookedByCurrentUser);
        } else {
            // Keep vehicles with remaining capacity OR already booked by this farmer (to display their ALREADY BOOKED status)
            result = result.filter(v => v.remainingCapacityKg > 0 || v.isBookedByCurrentUser);
        }

        if (effectiveKg > 0 && req.query.strictCapacity === "true") {
            result = result.filter(v => v.remainingCapacityKg >= effectiveKg);
        }
        if (vehicleType && vehicleType !== "any") {
            result = result.filter(v => v.vehicleType.toLowerCase().includes(vehicleType.toLowerCase()));
        }
        if (sharedOnly === "true") {
            result = result.filter(v => v.hasActiveSharedPool || v.remainingCapacityKg > 500);
        }

        // Prioritize vehicles: available matches first, then crop match score
        result.sort((a, b) => {
            if ((b.cropMatchScore || 0) !== (a.cropMatchScore || 0)) {
                return (b.cropMatchScore || 0) - (a.cropMatchScore || 0);
            }
            return (a.capacityKg || 0) - (b.capacityKg || 0);
        });

        return res.json({ success: true, count: result.length, data: result, vehicles: result });
    } catch (error) {
        console.error("Vehicle inventory error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load vehicle availability" });
    }
});

/**
 * POST /api/transport/vehicles
 * Register a new vehicle to transporter fleet
 */
router.post("/vehicles", requireRole("transporter", "admin"), async (req, res) => {
    try {
        const {
            registrationNumber,
            vehicleType,
            capacityKg,
            capacityUnit,
            supportedCrops,
            specialHandling,
            baseLocation,
            supportedRoutes,
            availableDate,
            ratePerKm,
            driverName,
            driverPhone
        } = req.body;

        if (!registrationNumber || !vehicleType || !driverName || !driverPhone) {
            return res.status(400).json({
                success: false,
                message: "Registration number, vehicle type, driver name, and driver phone are required."
            });
        }

        const rawCapacity = Number(capacityKg);
        if (Number.isNaN(rawCapacity) || rawCapacity <= 0) {
            return res.status(400).json({ success: false, message: "Capacity must be a positive number." });
        }

        const regNumClean = String(registrationNumber).trim().toUpperCase();
        const existing = await Vehicle.findOne({ where: { registrationNumber: regNumClean } });
        if (existing) {
            return res.status(409).json({ success: false, message: `Vehicle with registration ${regNumClean} is already registered.` });
        }

        const cropsString = Array.isArray(supportedCrops)
            ? supportedCrops.join(", ")
            : (supportedCrops || "Tomato, Onion, Potato, Vegetables");
        const routesString = Array.isArray(supportedRoutes)
            ? supportedRoutes.join(", ")
            : (supportedRoutes || "Pune to Mumbai Vashi APMC");

        const vehicle = await Vehicle.create({
            userId: req.user.id,
            registrationNumber: regNumClean,
            vehicleType: String(vehicleType).trim(),
            capacityKg: rawCapacity,
            capacityUnit: capacityUnit || "kg",
            supportedCrops: cropsString,
            specialHandling: specialHandling || "Ventilated",
            baseLocation: baseLocation || "Pune, Maharashtra",
            supportedRoutes: routesString,
            availableDate: availableDate || null,
            ratePerKm: Number(ratePerKm) || 25,
            driverName: String(driverName).trim(),
            driverPhone: String(driverPhone).trim(),
            isAvailable: true,
            status: "available"
        });

        // Also keep TransporterProfile in sync
        let profile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        if (profile) {
            await profile.update({
                driverName: vehicle.driverName,
                phone: vehicle.driverPhone,
                vehicleType: vehicle.vehicleType,
                vehicleNumber: vehicle.registrationNumber,
                capacityKg: vehicle.capacityKg,
                isAvailable: true
            });
        } else {
            await TransporterProfile.create({
                userId: req.user.id,
                driverName: vehicle.driverName,
                phone: vehicle.driverPhone,
                vehicleType: vehicle.vehicleType,
                vehicleNumber: vehicle.registrationNumber,
                capacityKg: vehicle.capacityKg,
                baseMandi: vehicle.baseLocation,
                ratePerKm: vehicle.ratePerKm,
                isAvailable: true
            });
        }

        return res.status(201).json({
            success: true,
            data: vehicle,
            message: `Vehicle ${vehicle.registrationNumber} (${vehicle.vehicleType}) registered successfully!`
        });
    } catch (error) {
        console.error("Add vehicle error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Failed to add vehicle" });
    }
});

/**
 * GET /api/transport/vehicles/my-fleet
 * View transporter's own registered vehicles
 */
router.get("/vehicles/my-fleet", requireRole("transporter", "admin"), async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]]
        });
        return res.json({ success: true, count: vehicles.length, data: vehicles });
    } catch (error) {
        console.error("My fleet error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load fleet" });
    }
});

/**
 * PUT /api/transport/vehicles/:id
 * Update vehicle details or availability
 */
router.put("/vehicles/:id", requireRole("transporter", "admin"), async (req, res) => {
    try {
        const vehicle = await Vehicle.findByPk(req.params.id);
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
        if (req.user.role !== "admin" && vehicle.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: "You can only update your own vehicles." });
        }

        const updates = {};
        if (req.body.isAvailable !== undefined) {
            const willBeAvailable = Boolean(req.body.isAvailable);
            const activeAssignment = await TransportRequest.findOne({
                where: {
                    vehicleId: vehicle.id,
                    status: { [Op.in]: ["accepted", "driver_assigned", "vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit"] }
                }
            });
            if (activeAssignment && willBeAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Vehicle ${vehicle.registrationNumber} is currently committed to active trip #${activeAssignment.bookingId || activeAssignment.id} and cannot be assigned to new bookings until delivery is completed.`
                });
            }
            updates.isAvailable = willBeAvailable;
        }
        if (req.body.status !== undefined) updates.status = req.body.status;
        if (req.body.ratePerKm !== undefined) updates.ratePerKm = Number(req.body.ratePerKm);
        if (req.body.driverName) updates.driverName = req.body.driverName.trim();
        if (req.body.driverPhone) updates.driverPhone = req.body.driverPhone.trim();
        if (req.body.supportedCrops) updates.supportedCrops = req.body.supportedCrops;
        if (req.body.specialHandling) updates.specialHandling = req.body.specialHandling;

        await vehicle.update(updates);
        return res.json({ success: true, data: vehicle, message: "Vehicle updated successfully." });
    } catch (error) {
        console.error("Update vehicle error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to update vehicle" });
    }
});

// ==============================================================================
// 2. FARMER BOOKING & SHARED POOLING APIS
// ==============================================================================

/**
 * POST /api/transport/bookings
 * Create an individual or shared vehicle booking
 */
router.post("/bookings", requireRole("farmer", "fpo_leader"), async (req, res) => {
    const { fields, error } = normalizeTransportInput(req.body, req.user);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        await ensureTransportSchema();
        const bookingUserId = await resolveBookingUserId(req.user);

        // Optional Idempotency key check
        const idempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotencyKey;
        if (idempotencyKey) {
            const existingByKey = await TransportRequest.findOne({
                where: {
                    userId: bookingUserId,
                    [Op.or]: [{ bookingId: idempotencyKey }, { gatePassCode: idempotencyKey }]
                }
            });
            if (existingByKey) {
                return res.status(200).json({
                    success: true,
                    data: existingByKey,
                    bookingId: existingByKey.bookingId,
                    gatePassCode: existingByKey.gatePassCode,
                    message: `Booking #${existingByKey.bookingId} verified via idempotency key.`
                });
            }
        }

        // Execute booking creation inside an atomic database transaction
        const booking = await sequelize.transaction(async (t) => {
            let vehicle = null;
            if (fields.vehicleId) {
                vehicle = await Vehicle.findByPk(fields.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
            } else if (req.body.transporterId) {
                vehicle = await Vehicle.findOne({
                    where: { userId: Number(req.body.transporterId), isAvailable: true },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });
            }

            if (vehicle) {
                if (!vehicle.isAvailable || vehicle.status === "maintenance") {
                    const err = new Error("The chosen vehicle is currently not available.");
                    err.statusCode = 400;
                    err.code = "VEHICLE_UNAVAILABLE";
                    throw err;
                }

                // 1. Check if THIS farmer already has an active booking on this vehicle for this crop and date
                const existingUserBooking = await TransportRequest.findOne({
                    where: {
                        userId: bookingUserId,
                        vehicleId: vehicle.id,
                        pickupDate: fields.pickupDate,
                        cropName: fields.cropName,
                        status: { [Op.in]: ACTIVE_BOOKING_STATUSES }
                    },
                    transaction: t
                });

                if (existingUserBooking) {
                    const err = new Error(
                        `You already have an active booking (#${existingUserBooking.bookingId || existingUserBooking.id}) for ${fields.cropName} on vehicle ${vehicle.registrationNumber} (Status: ${existingUserBooking.status.toUpperCase()}). Please manage your existing booking instead of creating a duplicate.`
                    );
                    err.statusCode = 409;
                    err.code = "DUPLICATE_BOOKING";
                    err.data = existingUserBooking;
                    throw err;
                }

                // 2. Rapid double-submission protection (within 10 seconds for same shipment requirement)
                const recentDuplicate = await TransportRequest.findOne({
                    where: {
                        userId: bookingUserId,
                        cropName: fields.cropName,
                        pickupDate: fields.pickupDate,
                        destinationMarket: fields.destinationMarket,
                        status: { [Op.in]: ACTIVE_BOOKING_STATUSES }
                    },
                    order: [["createdAt", "DESC"]],
                    transaction: t
                });

                if (recentDuplicate && (Date.now() - new Date(recentDuplicate.createdAt).getTime()) < 10000) {
                    const err = new Error(
                        `Duplicate booking prevented: A booking request (#${recentDuplicate.bookingId || recentDuplicate.id}) for ${fields.cropName} was just created. Please check My Bookings.`
                    );
                    err.statusCode = 409;
                    err.code = "DUPLICATE_BOOKING";
                    err.data = recentDuplicate;
                    throw err;
                }

                // 3. Authoritative remaining capacity check: total capacity - all active reservations
                const existingBookings = await TransportRequest.findAll({
                    where: {
                        vehicleId: vehicle.id,
                        pickupDate: fields.pickupDate,
                        status: { [Op.in]: ACTIVE_BOOKING_STATUSES }
                    },
                    transaction: t
                });

                const currentBookedKg = existingBookings.reduce((sum, b) => sum + (Number(b.weightKg) || 0), 0);
                const remainingCapacityKg = Math.max(0, vehicle.capacityKg - currentBookedKg);

                if (remainingCapacityKg <= 0) {
                    const err = new Error(`Vehicle ${vehicle.registrationNumber} is FULLY BOOKED for ${fields.pickupDate}. No capacity remaining.`);
                    err.statusCode = 409;
                    err.code = "VEHICLE_FULLY_BOOKED";
                    throw err;
                }

                if (fields.weightKg > remainingCapacityKg) {
                    const err = new Error(
                        `Vehicle capacity is ${vehicle.capacityKg} kg (${currentBookedKg} kg already booked). Only ${remainingCapacityKg} kg space remains, but ${fields.weightKg} kg was requested.`
                    );
                    err.statusCode = 409;
                    err.code = "INSUFFICIENT_CAPACITY";
                    throw err;
                }

                // 4. Check crop handling compatibility with already booked cargo for shared pooling
                if (existingBookings.length > 0 && fields.bookingType === "shared") {
                    for (const existing of existingBookings) {
                        if (!areCropsCompatibleForSharedTransport(existing.cropName, fields.cropName)) {
                            const err = new Error(
                                `Incompatible cargo: Cannot pool ${fields.cropName} with already booked ${existing.cropName} due to hygiene/storage requirements.`
                            );
                            err.statusCode = 400;
                            err.code = "INCOMPATIBLE_CARGO";
                            throw err;
                        }
                    }
                }

                // Assign vehicle details to the booking
                fields.vehicleId = vehicle.id;
                fields.transporterId = vehicle.userId;
                fields.vehicleType = vehicle.vehicleType;
                fields.vehicleNumber = vehicle.registrationNumber;
                fields.driverName = vehicle.driverName;
                fields.driverPhone = vehicle.driverPhone;
                fields.status = "confirmed";
            }

            // Create booking in database atomically
            const newBooking = await TransportRequest.create({
                ...fields,
                userId: bookingUserId
            }, { transaction: t });

            return newBooking;
        });

        return res.status(201).json({
            success: true,
            data: booking,
            bookingId: booking.bookingId,
            gatePassCode: booking.gatePassCode,
            message: `Booking #${booking.bookingId} confirmed! Digital APMC Gate Pass generated.`
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                code: err.code || "BOOKING_ERROR",
                message: err.message,
                data: err.data || null
            });
        }
        console.error("Create booking error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Unable to create booking" });
    }
});

/**
 * GET /api/transport/my-bookings
 * Get current user's transport bookings (farmer or transporter)
 */
router.get("/my-bookings", async (req, res) => {
    try {
        await ensureTransportSchema();
        const isTransporter = req.user.role === "transporter";
        const bookingUserId = await resolveBookingUserId(req.user);
        const whereCondition = isTransporter
            ? await getTransporterWhereCondition(req.user)
            : { [Op.or]: [{ userId: bookingUserId }, { userId: req.user.id }] };

        const bookings = await TransportRequest.findAll({
            where: whereCondition,
            order: [["createdAt", "DESC"]],
            include: [
                { model: Vehicle, required: false }
            ]
        });

        return res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        console.error("My bookings error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load bookings" });
    }
});

/**
 * PUT /api/transport/bookings/:id/cancel
 * Cancel a booking
 */
router.put("/bookings/:id/cancel", async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        // Authorization check: owner farmer, assigned transporter, or admin
        const bookingUserId = await resolveBookingUserId(req.user);
        const isOwner = Number(booking.userId) === Number(req.user.id) || Number(booking.userId) === Number(bookingUserId);
        const isTransporter = booking.transporterId && (Number(booking.transporterId) === Number(req.user.id) || Number(booking.transporterId) === Number(bookingUserId));
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isTransporter && !isAdmin) {
            return res.status(403).json({ success: false, message: "You are not authorized to cancel this booking." });
        }

        if (["delivered", "completed"].includes(booking.status)) {
            return res.status(400).json({ success: false, message: "Cannot cancel a completed delivery." });
        }

        const reason = req.body.reason ? String(req.body.reason).trim() : "Cancelled by user";
        await booking.update({
            status: "cancelled",
            cancellationReason: reason
        });

        // Revalidate parent shared trip if linked
        if (booking.sharedTripId) {
            try {
                const siblingBookings = await TransportRequest.findAll({
                    where: {
                        sharedTripId: booking.sharedTripId,
                        id: { [Op.ne]: booking.id },
                        status: { [Op.notIn]: ["cancelled", "rejected"] }
                    }
                });
                const sharedTrip = await SharedTrip.findByPk(booking.sharedTripId);
                if (sharedTrip) {
                    if (siblingBookings.length === 0) {
                        await sharedTrip.update({
                            status: "cancelled",
                            bookedWeightKg: 0,
                            remainingCapacityKg: sharedTrip.totalCapacityKg
                        });
                    } else {
                        const newBookedWeight = siblingBookings.reduce((sum, b) => sum + (Number(b.weightKg) || 0), 0);
                        await sharedTrip.update({
                            bookedWeightKg: newBookedWeight,
                            remainingCapacityKg: Math.max(0, sharedTrip.totalCapacityKg - newBookedWeight)
                        });
                        // Proportional fare rebalancing
                        const allocations = calculateSharedFareAllocation({
                            totalVehicleFare: sharedTrip.totalFare,
                            farmers: siblingBookings.map((b) => ({ id: b.id, weightKg: Number(b.weightKg) }))
                        });
                        for (const sibling of siblingBookings) {
                            const alloc = allocations.find((a) => a.id === sibling.id);
                            if (alloc) {
                                await sibling.update({
                                    estimatedSharedCost: alloc.sharedCost,
                                    sharingFarmersCount: siblingBookings.length
                                });
                            }
                        }
                    }
                }
            } catch (revalErr) {
                console.warn("Shared trip revalidation on cancel error:", revalErr.message);
            }
        }

        return res.json({
            success: true,
            data: booking,
            message: `Booking #${booking.bookingId || booking.id} has been cancelled.`
        });
    } catch (error) {
        console.error("Cancel booking error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to cancel booking" });
    }
});

// ==============================================================================
// 3. TRANSPORTER BOOKING MANAGEMENT & STATUS PROGRESSION
// ==============================================================================

/**
 * GET /api/transport/incoming-requests
 * Transporter views incoming requests with filters
 */
router.get("/incoming-requests", requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const { crop, vehicleType, status, bookingType, pickupLocation, destinationMarket } = req.query;

        const where = {};
        if (status === "pending") {
            where.status = { [Op.in]: ["pending", "open", "confirmed"] };
        } else if (status === "confirmed" || status === "accepted" || status === "driver_assigned") {
            where.status = { [Op.in]: ["confirmed", "accepted", "driver_assigned"] };
        } else if (status && status !== "all") {
            where.status = status;
        } else {
            // Default: show open, pending, confirmed, accepted, driver_assigned requests
            where.status = { [Op.in]: ["open", "pending", "confirmed", "accepted", "driver_assigned", "matched"] };
        }

        if (crop) where.cropName = { [Op.like]: `%${crop.trim()}%` };
        if (bookingType) where.bookingType = bookingType;
        if (pickupLocation) where.pickupLocation = { [Op.like]: `%${pickupLocation.trim()}%` };
        if (destinationMarket) where.destinationMarket = { [Op.like]: `%${destinationMarket.trim()}%` };

        if (req.user.role !== "admin") {
            where[Op.and] = [
                ...(where[Op.and] || []),
                {
                    [Op.or]: [
                        { status: { [Op.in]: ["open", "pending", "confirmed"] }, transporterId: null },
                        { transporterId: req.user.id }
                    ]
                }
            ];
        }

        const requests = await TransportRequest.findAll({
            where,
            include: [{ model: User, attributes: ["id", "name", "email", "role"] }],
            order: [["createdAt", "DESC"]],
            limit: 100
        });

        // Filter out test-runner generated records from live view
        const isLiveView = process.env.INCLUDE_TEST_DATA !== "true" && req.query.includeTest !== "true";
        const filteredRequests = isLiveView
            ? requests.filter(r => {
                const email = String(r.User?.email || "").toLowerCase();
                const name = String(r.User?.name || r.farmerName || "").toLowerCase();
                const isTestAccount = email.endsWith(".test") ||
                                      email.includes("_sec@") ||
                                      email.includes("@test.local") ||
                                      name === "farmer a" ||
                                      name === "farmer b" ||
                                      name === "escrow test farmer" ||
                                      name.includes("nashik agro fpo leader");
                return !isTestAccount;
            })
            : requests;

        const sanitized = filteredRequests.map(r => {
            const data = r.toJSON ? r.toJSON() : { ...r };
            if (req.user.role !== "admin" && Number(data.transporterId) !== Number(req.user.id)) {
                data.farmerPhone = null;
            }
            if (data.User) {
                data.organizationName = data.User.role === "fpo_leader" ? data.User.name : null;
                data.userRole = data.User.role;
            }
            return data;
        });

        return res.json({ success: true, count: sanitized.length, data: sanitized });
    } catch (error) {
        console.error("Incoming requests error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load incoming requests" });
    }
});

/**
 * PUT /api/transport/bookings/:id/accept (or /requests/:id/accept)
 * Transporter accepts booking and assigns vehicle/driver
 */
router.put(["/bookings/:id/accept", "/requests/:id/accept"], requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();

        const activeTripCount = await TransportRequest.count({
            where: {
                transporterId: req.user.id,
                status: { [Op.in]: ["accepted", "driver_assigned", "in_transit"] }
            }
        });
        if (activeTripCount > 0) {
            return res.status(409).json({ success: false, message: "Finish your active trip first." });
        }

        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (Number(booking.userId) === Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "You cannot accept your own booking request." });
        }

        if (!["open", "pending", "confirmed"].includes(booking.status)) {
            return res.status(409).json({ success: false, message: "Already taken or no longer open." });
        }

        // Locate vehicle to assign from the transporter's registered fleet
        let vehicle = null;
        if (req.body.vehicleId && req.body.vehicleId !== 'primary' && !isNaN(Number(req.body.vehicleId))) {
            vehicle = await Vehicle.findOne({ where: { id: Number(req.body.vehicleId), userId: req.user.id } });
        }
        if (!vehicle) {
            vehicle = await Vehicle.findOne({ where: { userId: req.user.id, isAvailable: true } });
        }

        const transporterProfile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        const knownCapacity = vehicle?.capacityKg || transporterProfile?.capacityKg;
        if (knownCapacity && Number(booking.weightKg) > Number(knownCapacity)) {
            return res.status(400).json({
                success: false,
                message: `Cargo weight (${booking.weightKg} kg) exceeds vehicle capacity (${knownCapacity} kg).`
            });
        }

        const driverName = (vehicle && vehicle.driverName) || req.body.driverName || transporterProfile?.driverName || req.user.name || "Assigned Driver";
        const driverPhone = (vehicle && vehicle.driverPhone) || req.body.driverPhone || transporterProfile?.phone || req.user.phone || null;
        const vehicleType = (vehicle && vehicle.vehicleType) || req.body.vehicleType || transporterProfile?.vehicleType || "Commercial Freight Vehicle";
        const vehicleNumber = (vehicle && vehicle.registrationNumber) || req.body.vehicleNumber || transporterProfile?.vehicleNumber || null;
        const vehicleId = vehicle?.id || null;

        const [affectedRows] = await TransportRequest.update({
            status: "driver_assigned",
            transporterId: req.user.id,
            vehicleId,
            driverName,
            driverPhone,
            vehicleType,
            vehicleNumber,
            tripStartTime: new Date()
        }, {
            where: {
                id: req.params.id,
                status: { [Op.in]: ["open", "pending", "confirmed"] }
            }
        });

        if (affectedRows === 0) {
            return res.status(409).json({ success: false, message: "Already taken or no longer open." });
        }

        // Mark transporter as actively on duty so they are removed from available booking pools
        await TransporterProfile.update(
            { isAvailable: false },
            { where: { userId: req.user.id } }
        ).catch(() => {});

        if (vehicleId) {
            await Vehicle.update(
                { isAvailable: false, status: "in_transit" },
                { where: { id: vehicleId } }
            ).catch(() => {});
        }

        await booking.reload();

        return res.json({
            success: true,
            data: booking,
            message: `Booking #${booking.bookingId || booking.id} accepted! Driver ${driverName} (${vehicleNumber}) assigned.`
        });
    } catch (error) {
        console.error("Accept booking error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to accept booking" });
    }
});

/**
 * PUT /api/transport/bookings/:id/reject (or /requests/:id/reject)
 * Transporter rejects a booking request with optional reason
 */
router.put(["/bookings/:id/reject", "/requests/:id/reject"], requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (req.user.role !== "admin") {
            if (booking.transporterId && Number(booking.transporterId) !== Number(req.user.id)) {
                return res.status(403).json({ success: false, message: "Not authorized to reject another transporter's booking." });
            }
        }

        if (["delivered", "completed"].includes(booking.status)) {
            return res.status(400).json({ success: false, message: "Cannot reject delivered or completed bookings." });
        }

        const reason = req.body.reason ? String(req.body.reason).trim() : "Transporter capacity full / route unavailable";
        await booking.update({
            status: "rejected",
            rejectionReason: reason
        });

        return res.json({
            success: true,
            data: booking,
            message: `Booking request rejected. Reason: ${reason}`
        });
    } catch (error) {
        console.error("Reject booking error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to reject booking" });
    }
});

/**
 * PUT /api/transport/bookings/:id/status (or /requests/:id/status, /requests/:id/progress)
 * Progress booking status: confirmed -> driver_assigned -> in_transit -> delivered/completed
 */
router.put(["/bookings/:id/status", "/requests/:id/status", "/requests/:id/progress"], requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (req.user.role !== "admin") {
            if (booking.transporterId && Number(booking.transporterId) !== Number(req.user.id)) {
                return res.status(403).json({ success: false, message: "Not your trip." });
            }
        }

        const current = booking.status;
        const nextStatus = req.body.status || req.body.nextStatus;

        const validTransitions = {
            open: ["driver_assigned", "accepted", "vehicle_assigned", "cancelled", "rejected"],
            pending: ["driver_assigned", "accepted", "vehicle_assigned", "cancelled", "rejected"],
            confirmed: ["vehicle_assigned", "driver_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit", "cancelled"],
            accepted: ["vehicle_assigned", "driver_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit", "cancelled", "rejected"],
            driver_assigned: ["vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit", "cancelled"],
            vehicle_assigned: ["awaiting_pickup", "pickup_confirmed", "in_transit", "cancelled"],
            awaiting_pickup: ["pickup_confirmed", "in_transit", "delayed", "cancelled"],
            pickup_confirmed: ["in_transit", "delayed", "cancelled"],
            in_transit: ["arrived_destination", "delivered", "delivery_confirmed", "completed", "delayed", "cancelled"],
            arrived_destination: ["delivered", "delivery_confirmed", "completed"],
            delivered: ["completed", "delivery_confirmed"],
            delivery_confirmed: ["completed"],
            delayed: ["pickup_confirmed", "in_transit", "arrived_destination", "delivered", "cancelled"]
        };

        if (!nextStatus || !validTransitions[current] || !validTransitions[current].includes(nextStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${current}' to '${nextStatus}'.`
            });
        }

        let history = [];
        try {
            history = booking.statusHistory ? JSON.parse(booking.statusHistory) : [];
            if (!Array.isArray(history)) history = [];
        } catch (_) {
            history = [];
        }
        history.push({
            from: current,
            to: nextStatus,
            timestamp: new Date().toISOString(),
            userId: req.user.id,
            notes: req.body.notes || null
        });

        await booking.update({
            status: nextStatus,
            statusHistory: JSON.stringify(history),
            ...(nextStatus === "in_transit" ? { tripStartTime: new Date() } : {}),
            ...(!booking.transporterId ? { transporterId: req.user.id } : {})
        });

        if (["delivered", "completed", "cancelled"].includes(nextStatus)) {
            await TransporterProfile.update(
                { isAvailable: true },
                { where: { userId: booking.transporterId || req.user.id } }
            ).catch(() => {});
            if (booking.vehicleId) {
                await Vehicle.update(
                    { isAvailable: true, status: "available" },
                    { where: { id: booking.vehicleId } }
                ).catch(() => {});
            }
        }

        return res.json({
            success: true,
            data: booking,
            message: `Trip status advanced to ${nextStatus.toUpperCase()}!`
        });
    } catch (error) {
        console.error("Update status error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to update booking status" });
    }
});

// ==============================================================================
// 4. SHARED TRIPS GROUPING & MANAGEMENT
// ==============================================================================

/**
 * GET /api/transport/suggested-groups
 * Proactively groups compatible pending farmer bookings into 2-4 farmer suggested shared trips
 */
router.get("/suggested-groups", requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        // Fetch all pending/open unassigned requests or requests for this transporter
        const requests = await TransportRequest.findAll({
            where: {
                status: { [Op.in]: ["open", "pending"] },
                sharedTripId: null,
                [Op.or]: [
                    { transporterId: null },
                    { transporterId: req.user.id }
                ]
            },
            order: [["pickupDate", "ASC"], ["createdAt", "ASC"]],
            limit: 100
        });

        // Transporter's vehicles to check usable capacity
        const myVehicles = await Vehicle.findAll({
            where: { userId: req.user.id, isAvailable: true }
        });
        const maxCapacity = myVehicles.length > 0
            ? Math.max(...myVehicles.map((v) => Number(v.capacityKg) || 2000))
            : 2200;
        const avgRatePerKm = myVehicles.length > 0 && myVehicles[0].ratePerKm
            ? Number(myVehicles[0].ratePerKm)
            : 25;

        const rawBookings = requests.map((r) => (r.toJSON ? r.toJSON() : { ...r }));
        const suggestions = suggestSharedTripGroups(rawBookings, {
            maxVehicleCapacityKg: maxCapacity,
            ratePerKm: avgRatePerKm
        });

        return res.json({
            success: true,
            count: suggestions.length,
            data: suggestions
        });
    } catch (error) {
        console.error("Suggested groups error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to calculate suggested shared trips" });
    }
});

/**
 * GET /api/transport/shared-trips
 * List all active shared transport pools
 */
router.get("/shared-trips", async (req, res) => {
    try {
        const trips = await SharedTrip.findAll({
            where: { status: { [Op.in]: ["open", "matched", "confirmed", "vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit"] } },
            include: [{ model: Vehicle }, { model: TransportRequest, as: "Bookings" }],
            order: [["tripDate", "ASC"]]
        });
        return res.json({ success: true, count: trips.length, data: trips });
    } catch (error) {
        console.error("Shared trips error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load shared trips" });
    }
});

/**
 * POST /api/transport/shared-trips/group
 * Transporter groups compatible farmer requests into a single shared trip
 */
router.post("/shared-trips/group", requireRole("transporter", "admin"), async (req, res) => {
    try {
        const { bookingIds, vehicleId, tripDate } = req.body;
        if (!Array.isArray(bookingIds) || bookingIds.length < 2) {
            return res.status(400).json({ success: false, message: "Provide at least two booking IDs to group into a shared trip." });
        }

        const vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found." });
        if (req.user.role !== "admin" && Number(vehicle.userId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "You can only assign vehicles from your own registered fleet." });
        }
        if (vehicle.isAvailable === false || vehicle.status === "busy") {
            return res.status(400).json({ success: false, message: `Vehicle ${vehicle.registrationNumber} is marked unavailable or busy.` });
        }

        // Check if vehicle is already committed to an active trip
        const conflictingTrip = await TransportRequest.findOne({
            where: {
                vehicleId: vehicle.id,
                status: { [Op.in]: ["accepted", "driver_assigned", "vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit"] }
            }
        });
        if (conflictingTrip) {
            return res.status(409).json({
                success: false,
                message: `Vehicle ${vehicle.registrationNumber} is already committed to an active trip (Booking #${conflictingTrip.bookingId || conflictingTrip.id}).`
            });
        }

        const bookings = await TransportRequest.findAll({
            where: { id: { [Op.in]: bookingIds } }
        });

        if (bookings.length !== bookingIds.length) {
            return res.status(404).json({ success: false, message: "One or more bookings could not be found." });
        }

        // Validate booking statuses and check duplicate assignment
        for (const b of bookings) {
            if (b.sharedTripId) {
                return res.status(409).json({
                    success: false,
                    message: `Booking #${b.bookingId || b.id} is already assigned to another shared trip.`
                });
            }
            if (["in_transit", "delivered", "completed", "cancelled", "rejected"].includes(b.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Booking #${b.bookingId || b.id} has invalid status '${b.status}' for pooling.`
                });
            }
        }

        // Validate cargo capacity
        const totalWeightKg = bookings.reduce((sum, b) => sum + (b.weightKg || 0), 0);
        if (totalWeightKg > vehicle.capacityKg) {
            return res.status(400).json({
                success: false,
                message: `Combined cargo (${totalWeightKg} kg) exceeds vehicle usable payload capacity of ${vehicle.capacityKg} kg.`
            });
        }

        // Validate route corridor compatibility
        for (let i = 0; i < bookings.length; i++) {
            for (let j = i + 1; j < bookings.length; j++) {
                if (!areRoutesCompatible(bookings[i].pickupLocation, bookings[i].destinationMarket, bookings[j].pickupLocation, bookings[j].destinationMarket)) {
                    return res.status(400).json({
                        success: false,
                        message: `Incompatible destinations/corridor: Cannot pool ${bookings[i].pickupLocation} ➔ ${bookings[i].destinationMarket} with ${bookings[j].pickupLocation} ➔ ${bookings[j].destinationMarket}.`
                    });
                }
                if (!areDatesCompatible(bookings[i].pickupDate, bookings[j].pickupDate, 1)) {
                    return res.status(400).json({
                        success: false,
                        message: `Incompatible pickup dates: ${bookings[i].pickupDate} and ${bookings[j].pickupDate} exceed acceptable 1-day time window.`
                    });
                }
            }
        }

        // Validate crop compatibility
        for (let i = 0; i < bookings.length; i++) {
            for (let j = i + 1; j < bookings.length; j++) {
                if (!areCropsCompatibleForSharedTransport(bookings[i].cropName, bookings[j].cropName)) {
                    return res.status(400).json({
                        success: false,
                        message: `Incompatible produce loads: Cannot pool ${bookings[i].cropName} with ${bookings[j].cropName}.`
                    });
                }
            }
        }

        // Calculate proportional fare split
        const destLower = String(bookings[0].destinationMarket || '').toLowerCase();
        let baseDistanceKm = 145;
        if (destLower.includes('mumbai') || destLower.includes('vashi')) baseDistanceKm = 165;
        else if (destLower.includes('nagpur')) baseDistanceKm = 480;
        else if (destLower.includes('nashik')) baseDistanceKm = 180;
        else if (destLower.includes('pune')) baseDistanceKm = 60;
        else if (destLower.includes('kolhapur')) baseDistanceKm = 230;

        const totalFare = Math.round((vehicle.ratePerKm || 25) * baseDistanceKm);
        const tripCode = `TRIP-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

        const allocations = calculateSharedFareAllocation({
            totalVehicleFare: totalFare,
            farmers: bookings.map((b) => ({ id: b.id, weightKg: Number(b.weightKg) }))
        });

        // Use database transaction for atomic trip creation
        const sharedTrip = await sequelize.transaction(async (t) => {
            const trip = await SharedTrip.create({
                tripCode,
                transporterId: req.user.id,
                vehicleId: vehicle.id,
                pickupLocation: bookings[0].pickupLocation,
                destinationMarket: bookings[0].destinationMarket,
                tripDate: tripDate || bookings[0].pickupDate,
                totalCapacityKg: vehicle.capacityKg,
                bookedWeightKg: totalWeightKg,
                remainingCapacityKg: Math.max(0, vehicle.capacityKg - totalWeightKg),
                totalFare,
                compatibleCategory: bookings[0].cropCategory || "general",
                status: "confirmed"
            }, { transaction: t });

            await vehicle.update({ isAvailable: false, status: "busy" }, { transaction: t });

            for (const b of bookings) {
                const alloc = allocations.find((a) => a.id === b.id);
                const share = alloc ? alloc.sharedCost : Math.round(totalFare * (b.weightKg / totalWeightKg));
                await b.update({
                    sharedTripId: trip.id,
                    vehicleId: vehicle.id,
                    transporterId: req.user.id,
                    driverName: vehicle.driverName,
                    driverPhone: vehicle.driverPhone,
                    vehicleType: vehicle.vehicleType,
                    vehicleNumber: vehicle.registrationNumber,
                    estimatedSharedCost: share,
                    bookingType: "shared",
                    sharingFarmersCount: bookings.length,
                    status: "confirmed"
                }, { transaction: t });
            }

            return trip;
        });

        return res.status(201).json({
            success: true,
            data: sharedTrip,
            message: `Created Shared Trip #${tripCode}! Pooled ${bookings.length} farmers (${totalWeightKg} kg total cargo).`
        });
    } catch (error) {
        console.error("Group shared trip error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Failed to group shared trip" });
    }
});

// ==============================================================================
// 5. BACKWARD-COMPATIBLE LEGACY ENDPOINTS (Preserved for existing frontend/tests)
// ==============================================================================

router.get("/my-requests", requireRole("farmer", "transporter", "fpo_leader"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const bookingUserId = await resolveBookingUserId(req.user);
        const whereCondition = req.user.role === "transporter"
            ? await getTransporterWhereCondition(req.user)
            : { [Op.or]: [{ userId: bookingUserId }, { userId: req.user.id }] };

        const data = await TransportRequest.findAll({
            where: whereCondition,
            include: [
                { model: Vehicle, required: false }
            ],
            order: [["createdAt", "DESC"]]
        });
        return res.json({ success: true, data });
    } catch (error) {
        console.error("My transport requests error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load transport requests" });
    }
});

router.post("/requests", requireRole("farmer", "fpo_leader"), async (req, res) => {
    const { fields, error } = normalizeTransportInput(req.body, req.user);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        await ensureTransportSchema();
        const bookingUserId = await resolveBookingUserId(req.user);
        const request = await TransportRequest.create({ ...fields, userId: bookingUserId });
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

router.get("/transporters", requireRole("farmer"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const includeDemo = req.query.includeDemo === "true";
        const transporters = await TransporterProfile.findAll({
            where: { isAvailable: true, userId: { [Op.ne]: req.user.id } },
            include: [{ model: User, attributes: ["id", "name", "email", "role"] }],
            order: [["createdAt", "DESC"]]
        });
        const filtered = transporters.filter(t => {
            if (!t.User) return false;
            if (!includeDemo && String(t.User.email || "").toLowerCase() === "transporter@harvestmitra.local") return false;
            return true;
        });
        return res.json({ success: true, data: filtered });
    } catch (error) {
        console.error("Transporters error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load transporters" });
    }
});

router.get("/open-cargo", requireRole("transporter"), async (req, res) => {
    try {
        const openRequests = await TransportRequest.findAll({
            where: {
                status: { [Op.in]: ["open", "pending"] },
                userId: { [Op.ne]: req.user.id }
            },
            order: [["createdAt", "DESC"]],
            limit: 50
        });
        const sanitized = openRequests.map(r => {
            const data = r.toJSON ? r.toJSON() : { ...r };
            if (Number(data.transporterId) !== Number(req.user.id)) {
                data.farmerPhone = null;
            }
            return data;
        });
        return res.json({ success: true, data: sanitized });
    } catch (error) {
        console.error("Open cargo error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load open cargo" });
    }
});

router.get("/active-trip", requireRole("transporter"), async (req, res) => {
    try {
        const transporterWhere = await getTransporterWhereCondition(req.user);
        const activeTrip = await TransportRequest.findOne({
            where: {
                ...transporterWhere,
                status: { [Op.in]: ["accepted", "driver_assigned", "vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit", "arrived_destination"] }
            },
            include: [
                { model: Vehicle, required: false },
                { model: SharedTrip, required: false, include: [{ model: TransportRequest, as: "Bookings", required: false }] }
            ],
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

router.get("/transporter-stats", requireRole("transporter"), async (req, res) => {
    try {
        const transporterWhere = await getTransporterWhereCondition(req.user);
        const todayStr = new Date().toISOString().slice(0, 10);

        const completedTrips = await TransportRequest.findAll({
            where: {
                ...transporterWhere,
                status: { [Op.in]: ["delivered", "delivery_confirmed", "completed"] }
            }
        });
        const activeTrips = await TransportRequest.findAll({
            where: {
                ...transporterWhere,
                status: { [Op.in]: ["accepted", "driver_assigned", "vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit", "arrived_destination"] }
            }
        });

        const newEligibleRequestsCount = await TransportRequest.count({
            where: {
                status: { [Op.in]: ["open", "pending"] },
                [Op.or]: [{ transporterId: null }, { transporterId: req.user.id }]
            }
        });

        const tripsAwaitingAssignmentCount = await TransportRequest.count({
            where: {
                transporterId: req.user.id,
                status: { [Op.in]: ["accepted", "confirmed"] },
                vehicleId: null
            }
        });

        const todayPickupsCount = await TransportRequest.count({
            where: {
                transporterId: req.user.id,
                pickupDate: todayStr,
                status: { [Op.notIn]: ["delivered", "delivery_confirmed", "completed", "cancelled", "rejected"] }
            }
        });

        const myVehicles = await Vehicle.findAll({
            where: { userId: req.user.id }
        });

        const totalTripsCompleted = completedTrips.length;
        const activeTripsCount = activeTrips.length;
        const totalCargoDeliveredKg = completedTrips.reduce((acc, r) => acc + (r.deliveredQuantity || r.weightKg || 0), 0);
        const totalEarnings = completedTrips.reduce((acc, r) => acc + (r.finalCost || r.estimatedSharedCost || 0), 0);

        // Strict financial separation (Phase 3 & 13)
        const confirmedFreightEarnings = completedTrips
            .filter((r) => r.paymentStatus === "paid")
            .reduce((acc, r) => acc + (r.finalCost || r.estimatedSharedCost || 0), 0);
        const completedTripTotals = totalEarnings;
        const pendingFreightEarnings = activeTrips
            .reduce((acc, r) => acc + (r.finalCost || r.estimatedSharedCost || 0), 0);
        const escrowLockedEarnings = activeTrips
            .filter((r) => r.paymentStatus === "in_escrow" || (r.escrowAmount && r.escrowAmount > 0))
            .reduce((acc, r) => acc + (r.escrowAmount || r.estimatedSharedCost || 0), 0);

        const transporterId = req.user.id;
        const transporterProfile = await TransporterProfile.findOne({ where: { userId: transporterId } });

        const registeredVehiclesCount = myVehicles.length;
        const availableVehiclesCount = myVehicles.filter((v) => v.isAvailable !== false && v.status !== "busy").length;

        return res.json({
            success: true,
            data: {
                totalTripsCompleted,
                deliveriesCompletedCount: totalTripsCompleted,
                activeTripsCount,
                newEligibleRequestsCount,
                tripsAwaitingAssignmentCount,
                todayPickupsCount,
                registeredVehiclesCount,
                availableVehiclesCount,
                totalCargoDeliveredKg,
                totalEarnings,
                confirmedFreightEarnings,
                completedTripTotals,
                pendingFreightEarnings,
                escrowLockedEarnings,
                vehicleType: transporterProfile?.vehicleType || (myVehicles[0]?.vehicleType || "Mahindra Bolero Maxi Truck"),
                vehicleNumber: transporterProfile?.vehicleNumber || (myVehicles[0]?.registrationNumber || "MH-12-RN-4921"),
                capacityKg: transporterProfile?.capacityKg || (myVehicles[0]?.capacityKg || 2200),
                rating: Number(transporterProfile?.rating || 4.8),
                totalRatings: Number(transporterProfile?.totalRatings || 1),
                isAvailable: availableVehiclesCount > 0 || (activeTripsCount === 0),
                activeTrip: activeTrips[0] || null
            }
        });
    } catch (error) {
        console.error("Transporter stats error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load transporter stats" });
    }
});

/**
 * GET /api/transport/trip-history
 * Transporter audit trail of completed and cancelled trips with filters
 */
router.get("/trip-history", requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const { startDate, endDate, status, vehicleId, destination } = req.query;
        const where = {
            transporterId: req.user.id
        };

        if (status && status !== "all") {
            where.status = status;
        } else {
            where.status = { [Op.in]: ["delivered", "delivery_confirmed", "completed", "cancelled"] };
        }

        if (vehicleId && vehicleId !== "all") {
            where.vehicleId = Number(vehicleId);
        }

        if (destination) {
            where.destinationMarket = { [Op.like]: `%${destination.trim()}%` };
        }

        if (startDate && endDate) {
            where.pickupDate = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.pickupDate = { [Op.gte]: startDate };
        } else if (endDate) {
            where.pickupDate = { [Op.lte]: endDate };
        }

        const trips = await TransportRequest.findAll({
            where,
            include: [
                { model: Vehicle, required: false },
                { model: SharedTrip, required: false, include: [{ model: TransportRequest, as: "Bookings", required: false }] }
            ],
            order: [["updatedAt", "DESC"]],
            limit: 200
        });

        const completedTrips = trips.filter((t) => ["delivered", "delivery_confirmed", "completed"].includes(t.status));
        const cancelledTrips = trips.filter((t) => t.status === "cancelled");
        const confirmedFreight = completedTrips
            .filter((t) => t.paymentStatus === "paid")
            .reduce((sum, t) => sum + (t.finalCost || t.estimatedSharedCost || 0), 0);
        const pendingSettlement = completedTrips
            .filter((t) => t.paymentStatus !== "paid")
            .reduce((sum, t) => sum + (t.finalCost || t.estimatedSharedCost || 0), 0);
        const totalCargoDeliveredKg = completedTrips.reduce((sum, t) => sum + (t.deliveredQuantity || t.weightKg || 0), 0);

        return res.json({
            success: true,
            count: trips.length,
            summary: {
                completedCount: completedTrips.length,
                cancelledCount: cancelledTrips.length,
                confirmedFreight,
                pendingSettlement,
                totalCargoDeliveredKg
            },
            data: trips
        });
    } catch (error) {
        console.error("Trip history error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load trip history" });
    }
});

/**
 * PUT /api/transport/requests/:id/pickup
 * PUT /api/transport/bookings/:id/pickup
 * Transporter records actual consignment pickup time, quantity loaded, and notes
 */
router.put(["/requests/:id/pickup", "/bookings/:id/pickup"], requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (req.user.role !== "admin" && Number(booking.transporterId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "Not your trip." });
        }

        const allowedStates = ["accepted", "driver_assigned", "vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "confirmed"];
        if (!allowedStates.includes(booking.status)) {
            return res.status(400).json({ success: false, message: `Cannot confirm pickup from current status '${booking.status}'.` });
        }

        const actualPickupTime = req.body.actualPickupTime ? new Date(req.body.actualPickupTime) : new Date();
        const loadedQuantity = req.body.loadedQuantity !== undefined ? Number(req.body.loadedQuantity) : booking.weightKg;
        const pickupNotes = req.body.pickupNotes ? String(req.body.pickupNotes).trim() : (req.body.notes ? String(req.body.notes).trim() : null);

        let history = [];
        try { history = JSON.parse(booking.statusHistory || "[]"); } catch (_) {}
        history.push({
            from: booking.status,
            to: "pickup_confirmed",
            timestamp: new Date().toISOString(),
            userId: req.user.id,
            notes: pickupNotes
        });

        await booking.update({
            status: "pickup_confirmed",
            actualPickupTime,
            loadedQuantity,
            pickupNotes,
            statusHistory: JSON.stringify(history)
        });

        return res.json({
            success: true,
            data: booking,
            message: `Pickup confirmed for ${booking.farmerName} (${loadedQuantity} kg ${booking.cropName}).`
        });
    } catch (error) {
        console.error("Pickup confirmation error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to record pickup confirmation" });
    }
});

/**
 * PUT /api/transport/requests/:id/delivery
 * PUT /api/transport/bookings/:id/delivery
 * Transporter records actual arrival at destination and delivery confirmation
 */
router.put(["/requests/:id/delivery", "/bookings/:id/delivery"], requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (req.user.role !== "admin" && Number(booking.transporterId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "Not your trip." });
        }

        const allowedStates = ["in_transit", "arrived_destination", "pickup_confirmed", "delivered"];
        if (!allowedStates.includes(booking.status)) {
            return res.status(400).json({ success: false, message: `Cannot confirm delivery from current status '${booking.status}'. Must be in transit or arrived.` });
        }

        const actualDeliveryTime = req.body.actualDeliveryTime ? new Date(req.body.actualDeliveryTime) : new Date();
        const deliveredQuantity = req.body.deliveredQuantity !== undefined ? Number(req.body.deliveredQuantity) : (booking.loadedQuantity || booking.weightKg);
        const deliveryNotes = req.body.deliveryNotes ? String(req.body.deliveryNotes).trim() : (req.body.notes ? String(req.body.notes).trim() : null);

        let history = [];
        try { history = JSON.parse(booking.statusHistory || "[]"); } catch (_) {}
        history.push({
            from: booking.status,
            to: "delivered",
            timestamp: new Date().toISOString(),
            userId: req.user.id,
            notes: deliveryNotes
        });

        await booking.update({
            status: "delivered",
            actualDeliveryTime,
            deliveredQuantity,
            deliveryNotes,
            statusHistory: JSON.stringify(history)
        });

        // If part of a shared trip, check if all sibling consignments are delivered
        if (booking.sharedTripId) {
            const undelivered = await TransportRequest.count({
                where: {
                    sharedTripId: booking.sharedTripId,
                    status: { [Op.notIn]: ["delivered", "delivery_confirmed", "completed", "cancelled"] }
                }
            });
            if (undelivered === 0) {
                await SharedTrip.update({ status: "delivered" }, { where: { id: booking.sharedTripId } });
                await TransporterProfile.update({ isAvailable: true }, { where: { userId: booking.transporterId } }).catch(() => {});
                if (booking.vehicleId) {
                    await Vehicle.update({ isAvailable: true, status: "available" }, { where: { id: booking.vehicleId } }).catch(() => {});
                }
            }
        } else {
            await TransporterProfile.update({ isAvailable: true }, { where: { userId: booking.transporterId } }).catch(() => {});
            if (booking.vehicleId) {
                await Vehicle.update({ isAvailable: true, status: "available" }, { where: { id: booking.vehicleId } }).catch(() => {});
            }
        }

        return res.json({
            success: true,
            data: booking,
            message: `Delivery recorded at ${booking.destinationMarket} for ${booking.farmerName} (${deliveredQuantity} kg).`
        });
    } catch (error) {
        console.error("Delivery confirmation error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to record delivery confirmation" });
    }
});

// Admin: List ALL transport requests across all farmers (Fixes #158)
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
        const activeTripCount = await TransportRequest.count({
            where: {
                transporterId: req.user.id,
                status: { [Op.in]: ["accepted", "driver_assigned", "in_transit"] }
            }
        });
        if (activeTripCount > 0) {
            return res.status(409).json({ success: false, message: "Finish your active trip first." });
        }

        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });
        if (Number(request.userId) === Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "You cannot accept your own transport request." });
        }

        const transporterProfile = await TransporterProfile.findOne({ where: { userId: req.user.id } });
        let vehicle = null;
        if (req.body.vehicleId) {
            vehicle = await Vehicle.findOne({ where: { id: req.body.vehicleId, userId: req.user.id } });
        }
        if (!vehicle) {
            vehicle = await Vehicle.findOne({ where: { userId: req.user.id, isAvailable: true } });
        }

        const knownCapacity = vehicle?.capacityKg || transporterProfile?.capacityKg;
        if (knownCapacity && Number(request.weightKg) > Number(knownCapacity)) {
            return res.status(400).json({
                success: false,
                message: `Cargo weight (${request.weightKg} kg) exceeds vehicle capacity (${knownCapacity} kg).`
            });
        }

        const driverName = req.body.driverName || vehicle?.driverName || transporterProfile?.driverName || req.user.name || "Assigned Driver";
        const driverPhone = req.body.driverPhone || vehicle?.driverPhone || transporterProfile?.phone || req.user.phone || "9876543210";
        const vehicleType = req.body.vehicleType || vehicle?.vehicleType || transporterProfile?.vehicleType || "Mahindra Bolero Maxi Truck";
        const vehicleNumber = req.body.vehicleNumber || vehicle?.registrationNumber || transporterProfile?.vehicleNumber || "MH-12-RN-4921";
        const estimatedDurationMinutes = req.body.estimatedDurationMinutes || request.estimatedDurationMinutes || 150;
        const vehicleId = vehicle?.id || null;

        const [affectedRows] = await TransportRequest.update({
            status: "accepted",
            transporterId: req.user.id,
            vehicleId,
            driverName,
            driverPhone,
            vehicleType,
            vehicleNumber,
            estimatedDurationMinutes,
            tripStartTime: new Date()
        }, {
            where: {
                id: req.params.id,
                status: { [Op.in]: ["open", "pending"] }
            }
        });

        if (affectedRows === 0) {
            return res.status(409).json({ success: false, message: "Already taken or no longer open." });
        }

        await TransporterProfile.update(
            { isAvailable: false },
            { where: { userId: req.user.id } }
        ).catch(() => {});
        if (vehicleId) {
            await Vehicle.update(
                { isAvailable: false, status: "in_transit" },
                { where: { id: vehicleId } }
            ).catch(() => {});
        }

        await request.reload();

        return res.json({
            success: true,
            data: request,
            message: `Trip accepted! Driver ${driverName} assigned with ${vehicleNumber}.`
        });
    } catch (error) {
        console.error("Accept cargo error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to accept cargo request" });
    }
});

router.put("/requests/:id/progress", requireRole("transporter"), async (req, res) => {
    try {
        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        if (Number(request.transporterId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "Not your trip." });
        }

        const nextStatus = req.body.nextStatus || req.body.status;
        const current = request.status;
        const validTransitions = {
            accepted: ["vehicle_assigned", "driver_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit", "cancelled", "rejected"],
            driver_assigned: ["vehicle_assigned", "awaiting_pickup", "pickup_confirmed", "in_transit", "cancelled"],
            vehicle_assigned: ["awaiting_pickup", "pickup_confirmed", "in_transit", "cancelled"],
            awaiting_pickup: ["pickup_confirmed", "in_transit", "delayed", "cancelled"],
            pickup_confirmed: ["in_transit", "delayed", "cancelled"],
            in_transit: ["arrived_destination", "delivered", "delivery_confirmed", "completed", "delayed"],
            arrived_destination: ["delivered", "delivery_confirmed", "completed"],
            delivered: ["completed", "delivery_confirmed"]
        };

        if (!nextStatus || !validTransitions[current] || !validTransitions[current].includes(nextStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${current}' to '${nextStatus}'.`
            });
        }

        await request.update({
            status: nextStatus,
            ...(nextStatus === "in_transit" ? { tripStartTime: new Date() } : {})
        });

        if (["delivered", "completed"].includes(nextStatus)) {
            await TransporterProfile.update(
                { isAvailable: true },
                { where: { userId: request.transporterId || req.user.id } }
            ).catch(() => {});
            if (request.vehicleId) {
                await Vehicle.update(
                    { isAvailable: true, status: "available" },
                    { where: { id: request.vehicleId } }
                ).catch(() => {});
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

router.put(["/requests/:id/confirm", "/bookings/:id/confirm"], requireRole("farmer", "fpo_leader"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const request = await TransportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        if (Number(request.userId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "Not your request." });
        }

        if (request.status !== "delivered") {
            return res.status(400).json({ success: false, message: "Delivery can only be confirmed when status is delivered." });
        }

        const wasInEscrow = request.paymentStatus === "in_escrow";
        await request.update({
            status: "completed",
            paymentStatus: wasInEscrow ? "paid" : (request.paymentStatus || "paid")
        });

        return res.json({
            success: true,
            data: request,
            message: wasInEscrow
                ? `Delivery confirmed! Trip completed and ₹${(request.escrowAmount || request.estimatedSharedCost || 1200).toLocaleString("en-IN")} escrow payout released to transporter.`
                : "Delivery confirmed and trip marked as completed."
        });
    } catch (error) {
        console.error("Confirm request error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to confirm delivery" });
    }
});

/**
 * POST /api/transport/bookings/:id/pay
 * Farmer locks freight fare in HarvestMitra Escrow via simulated UPI
 */
router.post("/bookings/:id/pay", requireRole("farmer", "fpo_leader"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (Number(booking.userId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "Not your booking." });
        }

        if (booking.paymentStatus === "in_escrow" || booking.paymentStatus === "paid") {
            return res.status(400).json({ success: false, message: "Payment is already secured in escrow or settled." });
        }

        const amount = Number(booking.estimatedSharedCost || booking.finalCost || 1200);
        const transactionId = `TXN-UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await booking.update({
            paymentStatus: "in_escrow",
            escrowAmount: amount
        });

        return res.json({
            success: true,
            data: {
                bookingId: booking.id,
                paymentStatus: "in_escrow",
                escrowAmount: amount,
                transactionId,
                paidAt: new Date().toISOString()
            },
            message: `Payment of ₹${amount.toLocaleString("en-IN")} secured in HarvestMitra Escrow! Funds will automatically transfer to transporter upon confirmed mandi delivery.`
        });
    } catch (error) {
        console.error("Escrow pay error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to process escrow payment." });
    }
});

/**
 * POST /api/transport/bookings/:id/review
 * Farmer rates and reviews driver/transporter after delivery
 */
router.post("/bookings/:id/review", requireRole("farmer", "fpo_leader"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (Number(booking.userId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "Not your booking." });
        }

        if (!["delivered", "completed"].includes(booking.status)) {
            return res.status(400).json({ success: false, message: "Driver can only be reviewed after cargo delivery." });
        }

        const rating = Math.min(5, Math.max(1, Math.round(Number(req.body.rating) || 5)));
        const review = req.body.review ? String(req.body.review).trim().slice(0, 500) : "Punctual delivery and safe cargo handling.";

        await booking.update({
            driverRating: rating,
            driverReview: review
        });

        if (booking.transporterId) {
            const profile = await TransporterProfile.findOne({ where: { userId: booking.transporterId } });
            if (profile) {
                const currentTotal = Number(profile.totalRatings || 1);
                const currentRating = Number(profile.rating || 4.8);
                const newTotal = currentTotal + 1;
                const newRating = Number(((currentRating * currentTotal + rating) / newTotal).toFixed(1));
                await profile.update({ rating: newRating, totalRatings: newTotal }).catch(() => {});
            }
        }

        return res.json({
            success: true,
            data: booking,
            message: `Thank you! Driver rating of ${rating}★ and review recorded.`
        });
    } catch (error) {
        console.error("Review driver error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to submit driver review." });
    }
});

/**
 * GET /api/transport/transporters/:id/rating
 * Public/authenticated view of transporter rating & reviews
 */
router.get("/transporters/:id/rating", async (req, res) => {
    try {
        await ensureTransportSchema();
        const profile = await TransporterProfile.findOne({ where: { userId: req.params.id } });
        if (!profile) return res.status(404).json({ success: false, message: "Transporter not found" });

        const recentReviews = await TransportRequest.findAll({
            where: {
                transporterId: req.params.id,
                driverRating: { [Op.ne]: null }
            },
            attributes: ["id", "farmerName", "cropName", "destinationMarket", "driverRating", "driverReview", "updatedAt"],
            order: [["updatedAt", "DESC"]],
            limit: 5
        });

        return res.json({
            success: true,
            data: {
                transporterId: profile.userId,
                driverName: profile.driverName,
                rating: Number(profile.rating || 4.8),
                totalRatings: Number(profile.totalRatings || 1),
                reviews: recentReviews
            }
        });
    } catch (error) {
        console.error("Get rating error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to fetch transporter rating." });
    }
});

router.post("/register-vehicle", requireRole("transporter"), async (req, res) => {
    try {
        const { driverName, phone, vehicleType, vehicleNumber, capacityKg, baseMandi, ratePerKm } = req.body;
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
                baseMandi: baseMandi || "Pune APMC",
                ratePerKm: ratePerKm ? Number(ratePerKm) : 25,
                isAvailable: true
            });
        }

        // Also add or update in Vehicle fleet table
        await Vehicle.findOrCreate({
            where: { registrationNumber: profile.vehicleNumber },
            defaults: {
                userId: req.user.id,
                registrationNumber: profile.vehicleNumber,
                vehicleType: profile.vehicleType,
                capacityKg: profile.capacityKg,
                capacityUnit: "kg",
                supportedCrops: "Tomato, Onion, Potato, Vegetables",
                specialHandling: "Standard Agri Transport",
                baseLocation: profile.baseMandi,
                supportedRoutes: `${profile.baseMandi} to Regional APMCs`,
                ratePerKm: profile.ratePerKm,
                driverName: profile.driverName,
                driverPhone: profile.phone,
                isAvailable: true,
                status: "available"
            }
        });

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

/**
 * POST /api/transport/match
 * Smart shared transport matching engine querying real DB vehicles and existing TransportRequests.
 */
router.post("/match", async (req, res) => {
    try {
        await ensureTransportSchema();
        const {
            farmerName = "Farmer",
            location = "Pune",
            destination = "Mumbai Vashi Mega APMC",
            quantity = 500,
            quantityUnit = "kg",
            requiredDate,
            crop = "Tomato"
        } = req.body;

        const effectiveKg = convertToKg(quantity, quantityUnit);
        const reqDate = requiredDate || new Date().toISOString().slice(0, 10);

        const includeDemo = req.body.includeDemo === true || req.query.includeDemo === "true";

        // Fetch real vehicles from DB with verified transporter associations
        const vehicles = await Vehicle.findAll({
            where: { isAvailable: true, status: "available" },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "role"]
                }
            ],
            order: [["capacityKg", "ASC"]]
        });

        const seenMatchIds = new Set();
        const activeVehicles = vehicles.filter(v => {
            if (!v.User) return false;
            if (v.User.role && v.User.role !== "transporter" && v.User.role !== "admin") return false;
            if (!includeDemo) {
                const email = String(v.User.email || "").toLowerCase();
                if (email === "transporter@harvestmitra.local") return false;
            }
            if (seenMatchIds.has(v.id)) return false;
            seenMatchIds.add(v.id);
            return true;
        });

        // Fetch active requests in DB that could be shared (status open, pending, confirmed, matched)
        const activeRequests = await TransportRequest.findAll({
            where: {
                status: { [Op.in]: ["open", "pending", "confirmed", "matched"] }
            }
        });

        const matches = [];

        for (const v of activeVehicles) {
            const vData = v.toJSON ? v.toJSON() : { ...v };
            const vCapacity = Number(vData.capacityKg) || 2000;
            
            // Find requests booked on this vehicle or on compatible route
            const vehicleBookings = activeRequests.filter(r => 
                (r.vehicleId && Number(r.vehicleId) === Number(vData.id)) ||
                (areRoutesCompatible(r.pickupLocation, location) && areRoutesCompatible(r.destinationMarket, destination))
            );

            const bookedWeight = vehicleBookings.reduce((sum, b) => sum + (Number(b.weightKg) || 0), 0);
            const remainingCapacity = Math.max(0, vCapacity - bookedWeight);

            // Capacity validation: does vehicle have room for farmer's crop?
            if (remainingCapacity < effectiveKg) continue;

            // Crop compatibility check
            const coFarmers = vehicleBookings.map(b => ({
                farmerName: b.farmerName ? `${b.farmerName.slice(0, 3)}***` : "Co-Farmer",
                quantity: b.weightKg,
                crop: b.cropName
            }));

            let cropsCompatible = true;
            for (const b of vehicleBookings) {
                if (!areCropsCompatibleForSharedTransport(crop, b.cropName)) {
                    cropsCompatible = false;
                    break;
                }
            }
            if (!cropsCompatible) continue;

            // Calculate fares and shared pooling savings
            const baseDistKm = destination.toLowerCase().includes("mumbai") ? 165 : 100;
            const ratePerKm = Number(vData.ratePerKm) || 24;
            const soloCost = Math.round(baseDistKm * ratePerKm);

            // Proportional cost split with co-farmers
            const allParticipants = [
                ...coFarmers.map(f => ({ farmerName: f.farmerName, quantity: f.quantity })),
                { farmerName, quantity: effectiveKg }
            ];

            const costBreakdown = calculateSharedTransportCost(soloCost, allParticipants);
            const myShare = costBreakdown.find(f => f.farmerName === farmerName) || {
                transportCost: Math.round(soloCost * 0.52),
                sharePercentage: 50
            };

            const sharedCost = Math.round(myShare.transportCost);
            const savings = Math.max(0, soloCost - sharedCost);
            const savingsPercent = soloCost > 0 ? Number(((savings / soloCost) * 100).toFixed(1)) : 0;

            let matchScore = 60;
            if (areRoutesCompatible(vData.baseLocation, location)) matchScore += 20;
            if (vehicleBookings.length > 0) matchScore += 20;

            matches.push({
                id: vData.id,
                driverName: vData.driverName || "Verified APMC Transporter",
                driverPhone: vData.driverPhone || "+91 98220 00000",
                vehicleType: vData.vehicleType,
                vehicleNumber: vData.registrationNumber,
                location: vData.baseLocation || location,
                destination: destination,
                capacity: vCapacity,
                availableCapacity: remainingCapacity,
                currentLoad: bookedWeight,
                availableDate: reqDate,
                departureTime: "06:00 AM",
                totalTripCost: soloCost,
                soloCost,
                sharedCost,
                savings,
                savingsPercent,
                farmerSharePercentage: myShare.sharePercentage,
                rating: 4.8,
                coFarmersCount: coFarmers.length,
                coFarmers,
                matchScore,
                isMatch: true,
                costBreakdown
            });
        }

        // Only include demo pools when explicitly requested (demo mode) and DB has 0 matches
        if (matches.length === 0 && includeDemo) {
            const defaultPools = [
                {
                    id: 991,
                    driverName: "Dnyaneshwar Shinde",
                    driverPhone: "+91 98220 44120",
                    vehicleType: "Tata 407 (Agri Freight)",
                    vehicleNumber: "MH-12-RN-4120",
                    location: location || "Pune",
                    destination: destination || "Mumbai Vashi Mega APMC",
                    capacity: 2500,
                    availableCapacity: Math.max(500, 2500 - 1000 - effectiveKg),
                    currentLoad: 1000,
                    availableDate: reqDate,
                    departureTime: "05:30 AM",
                    totalTripCost: 2600,
                    soloCost: 2600,
                    sharedCost: Math.round(2600 * (effectiveKg / (1000 + effectiveKg))),
                    savings: Math.max(0, 2600 - Math.round(2600 * (effectiveKg / (1000 + effectiveKg)))),
                    savingsPercent: Number(((Math.max(0, 2600 - Math.round(2600 * (effectiveKg / (1000 + effectiveKg)))) / 2600) * 100).toFixed(1)),
                    farmerSharePercentage: Number(((effectiveKg / (1000 + effectiveKg)) * 100).toFixed(1)),
                    rating: 4.9,
                    coFarmersCount: 1,
                    coFarmers: [
                        { farmerName: "Farmer in Haveli Cluster", quantity: 1000, crop: "Tomato" }
                    ],
                    matchScore: 90,
                    isMatch: true
                },
                {
                    id: 992,
                    driverName: "Santosh Gaikwad",
                    driverPhone: "+91 94220 88219",
                    vehicleType: "Mahindra Bolero Maxi Truck",
                    vehicleNumber: "MH-15-TC-8821",
                    location: location || "Nashik",
                    destination: destination || "Pune APMC (Gultekdi)",
                    capacity: 1800,
                    availableCapacity: Math.max(400, 1800 - 600 - effectiveKg),
                    currentLoad: 600,
                    availableDate: reqDate,
                    departureTime: "06:30 AM",
                    totalTripCost: 1900,
                    soloCost: 1900,
                    sharedCost: Math.round(1900 * (effectiveKg / (600 + effectiveKg))),
                    savings: Math.max(0, 1900 - Math.round(1900 * (effectiveKg / (600 + effectiveKg)))),
                    savingsPercent: Number(((Math.max(0, 1900 - Math.round(1900 * (effectiveKg / (600 + effectiveKg)))) / 1900) * 100).toFixed(1)),
                    farmerSharePercentage: Number(((effectiveKg / (600 + effectiveKg)) * 100).toFixed(1)),
                    rating: 4.8,
                    coFarmersCount: 1,
                    coFarmers: [
                        { farmerName: "Farmer in Niphad Mandi", quantity: 600, crop: "Onion" }
                    ],
                    matchScore: 85,
                    isMatch: true
                }
            ];
            matches.push(...defaultPools);
        }

        matches.sort((a, b) => b.matchScore - a.matchScore);

        return res.json({
            success: true,
            farmerRequest: {
                farmerName,
                location,
                destination,
                quantity: effectiveKg,
                crop,
                requiredDate: reqDate
            },
            matchesFound: matches.length,
            matches
        });
    } catch (error) {
        console.error("Match transport error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/transport/pool
 * Confirm and book into a shared transport pool with full DB validation.
 */
router.post("/pool", async (req, res) => {
    try {
        await ensureTransportSchema();
        const {
            vehicleId,
            farmerName = "Farmer",
            farmerPhone = "+91 98765 43210",
            quantity = 500,
            quantityUnit = "kg",
            crop = "Tomato",
            pickupLocation = "Pune",
            destinationMarket = "Mumbai Vashi Mega APMC",
            pickupDate,
            estimatedSharedCost
        } = req.body;

        const effectiveKg = convertToKg(quantity, quantityUnit);
        const reqDate = pickupDate || new Date().toISOString().slice(0, 10);

        // Duplicate check: Check if user/farmer already booked this vehicle on this date
        const userId = await resolveBookingUserId(req.user);
        const existing = await TransportRequest.findOne({
            where: {
                userId,
                vehicleId: vehicleId || null,
                pickupDate: reqDate,
                status: { [Op.in]: ["open", "pending", "matched", "confirmed"] }
            }
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "You already have an active booking for this vehicle on this date. Check My Bookings."
            });
        }

        // Capacity check
        let vehicle = null;
        if (vehicleId && !String(vehicleId).startsWith("99")) {
            vehicle = await Vehicle.findByPk(vehicleId);
            if (vehicle) {
                const activeBookings = await TransportRequest.findAll({
                    where: {
                        vehicleId: vehicle.id,
                        pickupDate: reqDate,
                        status: { [Op.in]: ["open", "pending", "confirmed", "matched", "accepted"] }
                    }
                });
                const bookedWeight = activeBookings.reduce((sum, b) => sum + (b.weightKg || 0), 0);
                if (bookedWeight + effectiveKg > vehicle.capacityKg) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient vehicle capacity. Available: ${vehicle.capacityKg - bookedWeight} kg, requested: ${effectiveKg} kg.`
                    });
                }
            }
        }

        const bookingId = `HM-POOL-${Math.floor(100000 + Math.random() * 900000)}`;
        const gatePassCode = `MH-APMC-${Math.floor(100000 + Math.random() * 900000)}`;

        const booking = await TransportRequest.create({
            userId,
            vehicleId: vehicle ? vehicle.id : null,
            bookingId,
            farmerName: farmerName.trim(),
            farmerPhone: farmerPhone.trim(),
            driverName: vehicle?.driverName || "Assigned APMC Driver",
            driverPhone: vehicle?.driverPhone || "+91 98220 44120",
            cropName: crop,
            cropCategory: getCropProfile(crop).category,
            pickupLocation: pickupLocation.trim(),
            destinationMarket: destinationMarket.trim(),
            pickupDate: reqDate,
            weightKg: effectiveKg,
            quantityUnit: "kg",
            originalQuantity: quantity,
            bookingType: "shared",
            sharingFarmersCount: 2,
            vehicleType: vehicle?.vehicleType || "Tata 407 (Agri Freight)",
            vehicleNumber: vehicle?.registrationNumber || "MH-12-RN-4120",
            status: "confirmed",
            estimatedSharedCost: estimatedSharedCost ? Number(estimatedSharedCost) : 1300,
            gatePassCode,
            paymentStatus: "unpaid"
        });

        return res.status(201).json({
            success: true,
            message: "Shared transport pool booked and confirmed successfully!",
            bookingId,
            data: booking
        });
    } catch (error) {
        console.error("Pool booking error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Failed to book shared transport pool" });
    }
});

router.ensureTransportSchema = ensureTransportSchema;
module.exports = router;

