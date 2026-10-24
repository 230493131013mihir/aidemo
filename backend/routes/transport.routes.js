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
    calculateSharedFareAllocation
} = require("../services/cropTransportCompatibility");

const router = express.Router();

function normalizeTransportInput(body, reqUser = {}) {
    const required = ["farmerName", "cropName", "pickupLocation", "destinationMarket", "pickupDate"];
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
            farmerName: String(body.farmerName).trim(),
            farmerPhone: reqUser?.role === "farmer"
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
                driver_review: { type: sequelize.Sequelize.TEXT, allowNull: true }
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

function requireRole(...roles) {
    return (req, res, next) => roles.includes(req.user?.role)
        ? next()
        : res.status(403).json({ success: false, message: "This action is not available for your account role." });
}

async function getTransporterWhereCondition(user) {
    return { transporterId: user.id };
}

async function resolveBookingUserId(user) {
    if (!user) return 1;
    if (user.isGuest || user.id === 999999) {
        let guestUser = await User.findOne({ where: { email: "guest@harvestmitra.local" } });
        if (!guestUser) {
            guestUser = await User.create({
                name: "Guest Farmer",
                email: "guest@harvestmitra.local",
                password: "GuestPassword123!",
                role: "farmer",
                phone: "9876543210"
            }).catch(() => null);
        }
        return guestUser ? guestUser.id : 1;
    }
    return user.id;
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

        // Fetch real vehicles from Vehicle table
        const vehicles = await Vehicle.findAll({
            where: { isAvailable: true, status: "available" },
            order: [["capacityKg", "ASC"]]
        });

        // If specific crop requested, get its handling profile
        const cropProfile = crop ? getCropProfile(crop) : null;

        // Augment each vehicle with live booking usage, crop suitability, and rates
        const augmented = await Promise.all(vehicles.map(async (v) => {
            const vehicleData = v.toJSON();

            // Calculate active bookings on this vehicle for the given date
            const tripDate = date || new Date().toISOString().slice(0, 10);
            const activeBookings = await TransportRequest.findAll({
                where: {
                    vehicleId: v.id,
                    pickupDate: tripDate,
                    status: { [Op.in]: ["confirmed", "accepted", "driver_assigned", "in_transit"] }
                }
            });

            const bookedWeightKg = activeBookings.reduce((sum, b) => sum + (b.weightKg || 0), 0);
            const remainingCapacityKg = Math.max(0, v.capacityKg - bookedWeightKg);

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

            // Estimate base distance
            const destStr = String(destination || "Vashi APMC").toLowerCase();
            let distanceKm = 100;
            if (destStr.includes("mumbai") || destStr.includes("vashi")) distanceKm = 165;
            else if (destStr.includes("pune")) distanceKm = 45;
            else if (destStr.includes("nashik")) distanceKm = 180;
            else if (destStr.includes("solapur")) distanceKm = 240;

            const ratePerKm = v.ratePerKm || 22;
            const estimatedSoloFare = Math.round(distanceKm * ratePerKm);
            const estimatedSharedFare = Math.round(estimatedSoloFare * 0.52);

            return {
                ...vehicleData,
                bookedWeightKg,
                remainingCapacityKg,
                isCropSuitable,
                isRecommended,
                cropMatchScore,
                cropSuitabilityReason,
                estimatedSoloFare,
                estimatedSharedFare,
                estimatedDurationMinutes: distanceKm > 100 ? 210 : 90,
                canAccommodateCargo: effectiveKg > 0 ? (remainingCapacityKg >= effectiveKg) : true,
                hasActiveSharedPool: activeBookings.length > 0,
                activeBookingsCount: activeBookings.length
            };
        }));

        // Apply filters
        let result = augmented;
        if (effectiveKg > 0) {
            result = result.filter(v => v.canAccommodateCargo);
        }
        if (vehicleType && vehicleType !== "any") {
            result = result.filter(v => v.vehicleType.toLowerCase().includes(vehicleType.toLowerCase()));
        }
        if (sharedOnly === "true") {
            result = result.filter(v => v.hasActiveSharedPool || v.remainingCapacityKg > 500);
        }

        // Prioritize vehicles tailored for the selected crop
        result.sort((a, b) => {
            if ((b.cropMatchScore || 0) !== (a.cropMatchScore || 0)) {
                return (b.cropMatchScore || 0) - (a.cropMatchScore || 0);
            }
            return (a.capacityKg || 0) - (b.capacityKg || 0);
        });

        return res.json({ success: true, count: result.length, data: result });
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

        const vehicle = await Vehicle.create({
            userId: req.user.id,
            registrationNumber: regNumClean,
            vehicleType: String(vehicleType).trim(),
            capacityKg: rawCapacity,
            capacityUnit: capacityUnit || "kg",
            supportedCrops: supportedCrops || "Tomato, Onion, Potato, Vegetables",
            specialHandling: specialHandling || "Ventilated",
            baseLocation: baseLocation || "Pune, Maharashtra",
            supportedRoutes: supportedRoutes || "Pune to Mumbai Vashi APMC",
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
        if (req.body.isAvailable !== undefined) updates.isAvailable = Boolean(req.body.isAvailable);
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
router.post("/bookings", requireRole("farmer"), async (req, res) => {
    const { fields, error } = normalizeTransportInput(req.body, req.user);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        await ensureTransportSchema();

        let vehicle = null;
        if (fields.vehicleId) {
            vehicle = await Vehicle.findByPk(fields.vehicleId);
        } else if (req.body.transporterId) {
            vehicle = await Vehicle.findOne({ where: { userId: Number(req.body.transporterId), isAvailable: true } });
        }

        // If specific vehicle chosen, validate capacity and compatibility
        if (vehicle) {
            if (!vehicle.isAvailable || vehicle.status === "maintenance") {
                return res.status(400).json({ success: false, message: "The chosen vehicle is currently not available." });
            }

            // Check live capacity on chosen vehicle for that pickup date
            const existingBookings = await TransportRequest.findAll({
                where: {
                    vehicleId: vehicle.id,
                    pickupDate: fields.pickupDate,
                    status: { [Op.in]: ["confirmed", "accepted", "driver_assigned", "in_transit"] }
                }
            });

            const currentBookedKg = existingBookings.reduce((sum, b) => sum + (b.weightKg || 0), 0);
            const remainingCapacityKg = vehicle.capacityKg - currentBookedKg;

            if (fields.weightKg > remainingCapacityKg) {
                return res.status(400).json({
                    success: false,
                    message: `Vehicle capacity is ${vehicle.capacityKg} kg (${currentBookedKg} kg already booked). Only ${remainingCapacityKg} kg space remains.`
                });
            }

            // Check crop handling compatibility with already booked cargo
            if (existingBookings.length > 0 && fields.bookingType === "shared") {
                for (const existing of existingBookings) {
                    if (!areCropsCompatibleForSharedTransport(existing.cropName, fields.cropName)) {
                        return res.status(400).json({
                            success: false,
                            message: `Incompatible cargo: Cannot pool ${fields.cropName} with already booked ${existing.cropName} due to hygiene/storage requirements.`
                        });
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

        // Create booking in database
        const bookingUserId = await resolveBookingUserId(req.user);
        const booking = await TransportRequest.create({
            ...fields,
            userId: bookingUserId
        });

        return res.status(201).json({
            success: true,
            data: booking,
            bookingId: booking.bookingId,
            gatePassCode: booking.gatePassCode,
            message: `Booking #${booking.bookingId} confirmed! Digital APMC Gate Pass generated.`
        });
    } catch (err) {
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
            where.status = { [Op.in]: ["pending", "open"] };
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
                        { status: { [Op.in]: ["open", "pending"] }, transporterId: null },
                        { transporterId: req.user.id }
                    ]
                }
            ];
        }

        const requests = await TransportRequest.findAll({
            where,
            order: [["createdAt", "DESC"]],
            limit: 100
        });

        const sanitized = requests.map(r => {
            const data = r.toJSON ? r.toJSON() : { ...r };
            if (req.user.role !== "admin" && Number(data.transporterId) !== Number(req.user.id)) {
                data.farmerPhone = null;
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
 * PUT /api/transport/bookings/:id/accept
 * Transporter accepts booking and assigns vehicle/driver
 */
router.put("/bookings/:id/accept", requireRole("transporter", "admin"), async (req, res) => {
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
            return res.status(409).json({ success: false, message: `Cannot accept booking in ${booking.status} status.` });
        }

        // Locate vehicle to assign
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
        const driverPhone = (vehicle && vehicle.driverPhone) || req.body.driverPhone || transporterProfile?.phone || req.user.phone || "9876543210";
        const vehicleType = (vehicle && vehicle.vehicleType) || req.body.vehicleType || transporterProfile?.vehicleType || "Mahindra Bolero Maxi Truck";
        const vehicleNumber = (vehicle && vehicle.registrationNumber) || req.body.vehicleNumber || transporterProfile?.vehicleNumber || "MH-12-RN-4921";
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
 * PUT /api/transport/bookings/:id/reject
 * Transporter rejects a booking request with optional reason
 */
router.put("/bookings/:id/reject", requireRole("transporter", "admin"), async (req, res) => {
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
 * PUT /api/transport/bookings/:id/status
 * Progress booking status: confirmed -> driver_assigned -> in_transit -> delivered/completed
 */
router.put("/bookings/:id/status", requireRole("transporter", "admin"), async (req, res) => {
    try {
        await ensureTransportSchema();
        const booking = await TransportRequest.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (req.user.role !== "admin" && Number(booking.transporterId) !== Number(req.user.id)) {
            return res.status(403).json({ success: false, message: "Not your trip." });
        }

        const nextStatus = req.body.status || req.body.nextStatus;
        const current = booking.status;
        const validTransitions = {
            open: ["driver_assigned", "accepted", "cancelled"],
            pending: ["driver_assigned", "accepted", "cancelled"],
            confirmed: ["driver_assigned", "in_transit", "cancelled"],
            accepted: ["in_transit", "cancelled"],
            driver_assigned: ["in_transit", "cancelled"],
            in_transit: ["delivered", "completed", "cancelled"],
            delivered: ["completed"]
        };

        if (!nextStatus || !validTransitions[current] || !validTransitions[current].includes(nextStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from '${current}' to '${nextStatus}'.`
            });
        }

        await booking.update({
            status: nextStatus,
            ...(nextStatus === "in_transit" ? { tripStartTime: new Date() } : {})
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
 * GET /api/transport/shared-trips
 * List all active shared transport pools
 */
router.get("/shared-trips", async (req, res) => {
    try {
        const trips = await SharedTrip.findAll({
            where: { status: { [Op.in]: ["open", "matched", "confirmed", "in_transit"] } },
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

        const bookings = await TransportRequest.findAll({
            where: { id: { [Op.in]: bookingIds } }
        });

        if (bookings.length !== bookingIds.length) {
            return res.status(404).json({ success: false, message: "One or more bookings could not be found." });
        }

        // Validate cargo capacity
        const totalWeightKg = bookings.reduce((sum, b) => sum + (b.weightKg || 0), 0);
        if (totalWeightKg > vehicle.capacityKg) {
            return res.status(400).json({
                success: false,
                message: `Combined cargo (${totalWeightKg} kg) exceeds vehicle capacity of ${vehicle.capacityKg} kg.`
            });
        }

        // Validate crop compatibility
        for (let i = 0; i < bookings.length; i++) {
            for (let j = i + 1; j < bookings.length; j++) {
                if (!areCropsCompatibleForSharedTransport(bookings[i].cropName, bookings[j].cropName)) {
                    return res.status(400).json({
                        success: false,
                        message: `Incompatible crops: Cannot pool ${bookings[i].cropName} with ${bookings[j].cropName}.`
                    });
                }
            }
        }

        // Calculate proportional fare split
        const totalFare = Math.round((vehicle.ratePerKm || 25) * 165);
        const tripCode = `TRIP-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

        const sharedTrip = await SharedTrip.create({
            tripCode,
            transporterId: req.user.id,
            vehicleId: vehicle.id,
            pickupLocation: bookings[0].pickupLocation,
            destinationMarket: bookings[0].destinationMarket,
            tripDate: tripDate || bookings[0].pickupDate,
            totalCapacityKg: vehicle.capacityKg,
            bookedWeightKg: totalWeightKg,
            remainingCapacityKg: vehicle.capacityKg - totalWeightKg,
            totalFare,
            compatibleCategory: bookings[0].cropCategory || "general",
            status: "confirmed"
        });

        // Update each booking with sharedTripId, assigned vehicle, and proportional cost
        for (const b of bookings) {
            const share = Math.round(totalFare * (b.weightKg / totalWeightKg));
            await b.update({
                sharedTripId: sharedTrip.id,
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
            });
        }

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

router.post("/requests", requireRole("farmer"), async (req, res) => {
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
                status: { [Op.in]: ["accepted", "driver_assigned", "in_transit"] }
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
                status: { [Op.in]: ["accepted", "driver_assigned", "in_transit"] }
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
                vehicleType: transporterProfile?.vehicleType || "Mahindra Bolero Maxi Truck",
                vehicleNumber: transporterProfile?.vehicleNumber || "MH-12-RN-4921",
                capacityKg: transporterProfile?.capacityKg || 2200,
                rating: Number(transporterProfile?.rating || 4.8),
                totalRatings: Number(transporterProfile?.totalRatings || 1),
                isAvailable: activeTripsCount === 0,
                activeTrip: activeTrips[0] || null
            }
        });
    } catch (error) {
        console.error("Transporter stats error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load transporter stats" });
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
            accepted: ["in_transit"],
            driver_assigned: ["in_transit"],
            in_transit: ["delivered", "completed"],
            delivered: ["completed"]
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

router.put("/requests/:id/confirm", requireRole("farmer"), async (req, res) => {
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
router.post("/bookings/:id/pay", requireRole("farmer"), async (req, res) => {
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
router.post("/bookings/:id/review", requireRole("farmer"), async (req, res) => {
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

router.ensureTransportSchema = ensureTransportSchema;
module.exports = router;

