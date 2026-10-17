const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, FarmerProfile, TransporterProfile, MandiProfile, ContactRequest } = require("../models");
const { Op } = require("sequelize");

function formatUserResponse(userInstance) {
    if (!userInstance) return null;
    const data = userInstance.toJSON ? userInstance.toJSON() : { ...userInstance };
    delete data.password;
    return data;
}

function detectStateFromDistrict(district, providedState) {
    if (providedState && providedState.trim()) {
        return providedState.trim();
    }
    // Default strictly to Maharashtra for state detection
    return "Maharashtra";
}

// Ensure farmer profile exists for a user
async function ensureFarmerProfile(userId, defaults = {}) {
    let profile = await FarmerProfile.findOne({ where: { userId } });
    if (!profile) {
        const dist = defaults.district || "Pune";
        profile = await FarmerProfile.create({
            userId,
            district: dist,
            state: "Maharashtra",
            village: defaults.village || "Haveli",
            farmSizeAcres: defaults.farmSizeAcres || 3.5,
            mainCrop: defaults.mainCrop || "Tomato",
            currentHarvestKg: defaults.currentHarvestKg || 500,
            preferredLanguage: defaults.preferredLanguage || "en"
        });
    }
    return profile;
}

// Ensure transporter profile exists for a user
async function ensureTransporterProfile(userId, defaults = {}) {
    let profile = await TransporterProfile.findOne({ where: { userId } });
    if (!profile) {
        profile = await TransporterProfile.create({
            userId,
            driverName: defaults.name || "Transporter",
            phone: defaults.phone || "9822012345",
            vehicleType: defaults.vehicleType || "Tata 407 Agri LCV",
            vehicleNumber: defaults.vehicleNumber || `MH-12-TR-${Math.floor(1000 + Math.random() * 9000)}`,
            capacityKg: defaults.capacityKg || 2500,
            baseMandi: defaults.baseMandi || "Pune APMC",
            ratePerKm: defaults.ratePerKm || 28,
            isAvailable: true
        });
    }
    return profile;
}

// Ensure mandi profile exists for a user
async function ensureMandiProfile(userId, defaults = {}) {
    let profile = await MandiProfile.findOne({ where: { userId } });
    if (!profile) {
        profile = await MandiProfile.create({
            userId,
            mandiName: defaults.mandiName || "Pune APMC Central Mandi",
            licenseNumber: defaults.licenseNumber || `MH-APMC-LIC-${Math.floor(100000 + Math.random() * 900000)}`,
            district: defaults.district || "Pune",
            state: "Maharashtra",
            operatingDays: defaults.operatingDays || "Mon-Sat",
            contactPhone: defaults.phone || "9822012345",
            contactEmail: defaults.email || "pune.apmc@harvestmitra.local",
            facilities: defaults.facilities || "Electronic Auction, Direct Payment, Cold Storage, Modern Weighbridge"
        });
    }
    return profile;
}

// =========================
// REGISTER
// =========================
const register = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            role = "farmer",
            // Farmer fields
            district = "Pune",
            state = "Maharashtra",
            village,
            farmSizeAcres,
            mainCrop,
            customCrop,
            currentHarvestKg,
            productQuantities,
            preferredLanguage = "en",
            // Transporter fields
            vehicleType,
            vehicleNumber,
            capacityKg,
            baseMandi,
            ratePerKm,
            // Mandi fields
            mandiName,
            licenseNumber,
            facilities,
            operatingDays
        } = req.body;

        // 1. Validate Full Name
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please enter your full name (minimum 2 characters)."
            });
        }

        // 2. Validate Email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        // 3. Validate Mobile Number
        const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);
        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit mobile number."
            });
        }

        // 4. Validate Password
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 5. Check if Email Already Exists
        const existingEmail = await User.findOne({
            where: { email: normalizedEmail }
        });

        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "This email address is already registered. Please login instead."
            });
        }

        // 6. Check if Mobile Number Already Exists
        const existingPhone = await User.findOne({
            where: { phone: cleanPhone }
        });

        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "This mobile number is already registered with another account. Please use a different number or login."
            });
        }

        // 7. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const assignedRole = role === "transporter" ? "transporter" : role === "mandi" ? "mandi" : "farmer";

        // 8. Create user in MySQL
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: cleanPhone,
            password: hashedPassword,
            role: assignedRole
        });

        let profile = null;
        let transporterProfile = null;
        let mandiProfile = null;

        if (assignedRole === "transporter") {
            transporterProfile = await TransporterProfile.create({
                userId: user.id,
                driverName: name.trim(),
                phone: cleanPhone,
                vehicleType: vehicleType ? vehicleType.trim() : "Tata 407 Agri LCV",
                vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : `MH-12-TR-${Math.floor(1000 + Math.random() * 9000)}`,
                capacityKg: capacityKg && !Number.isNaN(Number(capacityKg)) ? Number(capacityKg) : 2500,
                baseMandi: baseMandi ? baseMandi.trim() : `${district.trim()} APMC`,
                ratePerKm: ratePerKm && !Number.isNaN(Number(ratePerKm)) ? Number(ratePerKm) : 28,
                isAvailable: true
            });
        } else if (assignedRole === "mandi") {
            mandiProfile = await MandiProfile.create({
                userId: user.id,
                mandiName: mandiName ? mandiName.trim() : `${district.trim()} APMC Mandi`,
                licenseNumber: licenseNumber ? licenseNumber.trim().toUpperCase() : `MH-APMC-LIC-${Math.floor(100000 + Math.random() * 900000)}`,
                district: district ? district.trim() : "Pune",
                state: "Maharashtra",
                operatingDays: operatingDays || "Mon-Sat",
                contactPhone: cleanPhone,
                contactEmail: normalizedEmail,
                facilities: facilities || "Electronic Auction, Direct Payment, Weighbridge, Cold Storage"
            });
        } else {
            // Farmer
            profile = await FarmerProfile.create({
                userId: user.id,
                district: district ? district.trim() : "Pune",
                state: "Maharashtra",
                village: village ? village.trim() : "",
                farmSizeAcres: farmSizeAcres && !Number.isNaN(Number(farmSizeAcres)) ? Number(farmSizeAcres) : 3.5,
                mainCrop: mainCrop ? String(mainCrop).trim() : "Tomato",
                customCrop: customCrop ? String(customCrop).trim() : null,
                currentHarvestKg: currentHarvestKg && !Number.isNaN(Number(currentHarvestKg)) ? Number(currentHarvestKg) : 500,
                productQuantities: productQuantities ? (typeof productQuantities === 'string' ? productQuantities : JSON.stringify(productQuantities)) : null,
                preferredLanguage: preferredLanguage || "en"
            });
        }

        const roleTitle = assignedRole === "transporter" ? "Transporter" : assignedRole === "mandi" ? "Mandi Official" : "Farmer";

        return res.status(201).json({
            success: true,
            message: `Account registered successfully as ${roleTitle}! Please login with your credentials.`,
            registeredEmail: user.email,
            role: user.role,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                FarmerProfile: profile,
                TransporterProfile: transporterProfile,
                MandiProfile: mandiProfile
            }
        });

    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error during registration"
        });
    }
};

// =========================
// LOGIN
// =========================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email/Phone and password are required"
            });
        }

        const identifier = String(email).trim();
        const cleanPhone = identifier.replace(/\D/g, "").slice(-10);

        // Find user by either email OR 10-digit mobile number
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identifier.toLowerCase() },
                    ...(cleanPhone && cleanPhone.length === 10 ? [{ phone: cleanPhone }] : [])
                ]
            },
            include: [
                { model: FarmerProfile },
                { model: TransporterProfile },
                { model: MandiProfile }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email or mobile number. Please register first."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password. Please verify your password and try again."
            });
        }

        // Ensure profile exists based on role
        if (user.role === "farmer" && !user.FarmerProfile) {
            user.FarmerProfile = await ensureFarmerProfile(user.id);
        }
        if (user.role === "transporter" && !user.TransporterProfile) {
            user.TransporterProfile = await ensureTransporterProfile(user.id, { name: user.name, phone: user.phone });
        }
        if (user.role === "mandi" && !user.MandiProfile) {
            user.MandiProfile = await ensureMandiProfile(user.id, { name: user.name, phone: user.phone, email: user.email });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: formatUserResponse(user)
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};

// =========================
// GET CURRENT USER
// =========================
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
            include: [
                { model: FarmerProfile },
                { model: TransporterProfile },
                { model: MandiProfile }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role === "farmer" && !user.FarmerProfile) {
            const profile = await ensureFarmerProfile(user.id);
            user.setDataValue("FarmerProfile", profile);
        }
        if (user.role === "transporter" && !user.TransporterProfile) {
            const profile = await ensureTransporterProfile(user.id, { name: user.name, phone: user.phone });
            user.setDataValue("TransporterProfile", profile);
        }
        if (user.role === "mandi" && !user.MandiProfile) {
            const profile = await ensureMandiProfile(user.id, { name: user.name, phone: user.phone, email: user.email });
            user.setDataValue("MandiProfile", profile);
        }

        return res.status(200).json({
            success: true,
            user: formatUserResponse(user)
        });

    } catch (error) {
        console.error("Get Me Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// =========================
// DEMO LOGIN
// =========================
const demoLogin = async (req, res) => {
    if (process.env.ENABLE_DEMO_MODE === "false") {
        return res.status(404).json({ success: false, message: "Demo mode is disabled" });
    }

    try {
        const user = await User.findOne({
            where: { email: "demo@harvestmitra.local" },
            include: [{ model: FarmerProfile }, { model: TransporterProfile }, { model: MandiProfile }]
        });

        if (!user) {
            return res.status(503).json({ success: false, message: "Demo account is not seeded" });
        }

        if (!user.FarmerProfile) {
            const profile = await ensureFarmerProfile(user.id, {
                district: "Pune",
                state: "Maharashtra",
                village: "Haveli",
                farmSizeAcres: 3.5,
                preferredLanguage: "mr"
            });
            user.setDataValue("FarmerProfile", profile);
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.json({
            success: true,
            message: "Demo login successful",
            token,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error("Demo login error:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// =========================
// UPDATE PROFILE
// =========================
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            phone,
            district,
            state = "Maharashtra",
            village,
            farmSizeAcres,
            preferredLanguage,
            mainCrop,
            customCrop,
            currentHarvestKg,
            productQuantities,
            // Mandi fields
            mandiName,
            licenseNumber,
            facilities,
            operatingDays
        } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (name && name.trim()) user.name = name.trim();
        if (phone !== undefined) user.phone = phone ? phone.trim() : null;
        await user.save();

        // Update or create FarmerProfile for farmer
        if (user.role === "farmer" || district || farmSizeAcres || mainCrop) {
            let profile = await FarmerProfile.findOne({ where: { userId } });
            if (!profile) {
                profile = await FarmerProfile.create({
                    userId,
                    district: district ? district.trim() : "Pune",
                    state: "Maharashtra",
                    village: village || "",
                    farmSizeAcres: farmSizeAcres ? Number(farmSizeAcres) : 3.5,
                    mainCrop: mainCrop || "Tomato",
                    customCrop: customCrop || null,
                    currentHarvestKg: currentHarvestKg ? Number(currentHarvestKg) : 500,
                    productQuantities: productQuantities ? (typeof productQuantities === 'string' ? productQuantities : JSON.stringify(productQuantities)) : null,
                    preferredLanguage: preferredLanguage || "en"
                });
            } else {
                if (district !== undefined) profile.district = district.trim();
                profile.state = "Maharashtra";
                if (village !== undefined) profile.village = village.trim();
                if (farmSizeAcres !== undefined && !Number.isNaN(Number(farmSizeAcres))) {
                    profile.farmSizeAcres = Number(farmSizeAcres);
                }
                if (mainCrop !== undefined) profile.mainCrop = String(mainCrop).trim();
                if (customCrop !== undefined) profile.customCrop = customCrop ? String(customCrop).trim() : null;
                if (currentHarvestKg !== undefined && !Number.isNaN(Number(currentHarvestKg))) {
                    profile.currentHarvestKg = Number(currentHarvestKg);
                }
                if (productQuantities !== undefined) {
                    profile.productQuantities = typeof productQuantities === 'string' ? productQuantities : JSON.stringify(productQuantities);
                }
                if (preferredLanguage !== undefined) profile.preferredLanguage = preferredLanguage;
                await profile.save();
            }
        }

        // Update or create TransporterProfile
        if (user.role === "transporter" || req.body.vehicleNumber || req.body.vehicleType) {
            let transProfile = await TransporterProfile.findOne({ where: { userId } });
            if (!transProfile) {
                transProfile = await TransporterProfile.create({
                    userId,
                    driverName: name ? name.trim() : user.name,
                    phone: phone ? phone.trim() : user.phone,
                    vehicleType: req.body.vehicleType ? req.body.vehicleType.trim() : "Tata 407 Agri LCV",
                    vehicleNumber: req.body.vehicleNumber ? req.body.vehicleNumber.trim().toUpperCase() : "MH-12-TR-4921",
                    capacityKg: req.body.capacityKg ? Number(req.body.capacityKg) : 2500,
                    baseMandi: req.body.baseMandi ? req.body.baseMandi.trim() : "Pune APMC",
                    ratePerKm: req.body.ratePerKm ? Number(req.body.ratePerKm) : 28,
                    isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true
                });
            } else {
                if (name) transProfile.driverName = name.trim();
                if (phone) transProfile.phone = phone.trim();
                if (req.body.vehicleType) transProfile.vehicleType = req.body.vehicleType.trim();
                if (req.body.vehicleNumber) transProfile.vehicleNumber = req.body.vehicleNumber.trim().toUpperCase();
                if (req.body.capacityKg !== undefined && !Number.isNaN(Number(req.body.capacityKg))) {
                    transProfile.capacityKg = Number(req.body.capacityKg);
                }
                if (req.body.baseMandi) transProfile.baseMandi = req.body.baseMandi.trim();
                if (req.body.ratePerKm !== undefined && !Number.isNaN(Number(req.body.ratePerKm))) {
                    transProfile.ratePerKm = Number(req.body.ratePerKm);
                }
                if (req.body.isAvailable !== undefined) {
                    transProfile.isAvailable = Boolean(req.body.isAvailable);
                }
                await transProfile.save();
            }
        }

        // Update or create MandiProfile
        if (user.role === "mandi" || mandiName || licenseNumber) {
            let mProfile = await MandiProfile.findOne({ where: { userId } });
            if (!mProfile) {
                mProfile = await MandiProfile.create({
                    userId,
                    mandiName: mandiName || `${user.name} APMC`,
                    licenseNumber: licenseNumber || "MH-APMC-LIC-411001",
                    district: district || "Pune",
                    state: "Maharashtra",
                    operatingDays: operatingDays || "Mon-Sat",
                    contactPhone: phone || user.phone,
                    contactEmail: user.email,
                    facilities: facilities || "Electronic Auction, Direct Payment, Cold Storage, Modern Weighbridge"
                });
            } else {
                if (mandiName) mProfile.mandiName = mandiName.trim();
                if (licenseNumber) mProfile.licenseNumber = licenseNumber.trim().toUpperCase();
                if (district) mProfile.district = district.trim();
                mProfile.state = "Maharashtra";
                if (operatingDays) mProfile.operatingDays = operatingDays.trim();
                if (phone) mProfile.contactPhone = phone.trim();
                if (facilities) mProfile.facilities = facilities.trim();
                await mProfile.save();
            }
        }

        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ["password"] },
            include: [
                { model: FarmerProfile },
                { model: TransporterProfile },
                { model: MandiProfile }
            ]
        });

        return res.json({
            success: true,
            message: "Profile updated successfully",
            user: formatUserResponse(updatedUser)
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile"
        });
    }
};

// ==========================================
// MANDI-FARMER CONTACT REQUESTS (Req 8)
// ==========================================

// Create a new contact request
const createContactRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const sender = await User.findByPk(senderId, {
            include: [{ model: FarmerProfile }, { model: MandiProfile }]
        });

        if (!sender) {
            return res.status(404).json({ success: false, message: "Sender not found" });
        }

        const {
            receiverId,
            cropName,
            quantityKg,
            proposedPricePerKg,
            message,
            contactType
        } = req.body;

        if (!receiverId || !cropName) {
            return res.status(400).json({
                success: false,
                message: "Receiver ID and Crop Name are required"
            });
        }

        const receiver = await User.findByPk(receiverId, {
            include: [{ model: FarmerProfile }, { model: MandiProfile }]
        });

        if (!receiver) {
            return res.status(404).json({ success: false, message: "Target user not found" });
        }

        const qty = Number(quantityKg);
        if (Number.isNaN(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid positive quantity (in kg)"
            });
        }

        const contactReq = await ContactRequest.create({
            senderId,
            senderName: sender.name,
            senderRole: sender.role,
            senderContact: sender.phone || sender.email,
            receiverId: receiver.id,
            receiverName: receiver.name,
            receiverRole: receiver.role,
            cropName: String(cropName).trim(),
            quantityKg: qty,
            proposedPricePerKg: proposedPricePerKg ? Number(proposedPricePerKg) : null,
            message: message ? String(message).trim() : `Inquiry regarding ${qty} kg of ${cropName}.`,
            status: "pending",
            contactType: contactType || (sender.role === 'mandi' ? 'mandi_to_farmer' : 'farmer_to_mandi')
        });

        return res.status(201).json({
            success: true,
            message: "Contact request submitted successfully and recorded persistently in database.",
            data: contactReq
        });
    } catch (error) {
        console.error("Create Contact Request error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to submit contact request"
        });
    }
};

// Retrieve contact requests for current user (both sent and received)
const getContactRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await ContactRequest.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            order: [["createdAt", "DESC"]]
        });

        return res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error("Get Contact Requests error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve contact requests"
        });
    }
};

// Update status of a contact request (e.g. accepted / declined)
const updateContactRequestStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'declined', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const contactReq = await ContactRequest.findByPk(id);
        if (!contactReq) {
            return res.status(404).json({ success: false, message: "Contact request not found" });
        }

        // Only receiver can accept or decline
        if (contactReq.receiverId !== userId && contactReq.senderId !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to update this contact request" });
        }

        contactReq.status = status;
        await contactReq.save();

        return res.json({
            success: true,
            message: `Contact request marked as ${status}.`,
            data: contactReq
        });
    } catch (error) {
        console.error("Update Contact Request Status error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update contact request"
        });
    }
};

// Discover relevant registered farmers for Mandi users
const getRelevantFarmers = async (req, res) => {
    try {
        const { crop, district } = req.query;
        const where = { role: "farmer" };
        const profileWhere = { state: "Maharashtra" };

        if (district && district.trim()) {
            profileWhere.district = { [Op.like]: `%${district.trim()}%` };
        }
        if (crop && crop.trim()) {
            profileWhere[Op.or] = [
                { mainCrop: { [Op.like]: `%${crop.trim()}%` } },
                { customCrop: { [Op.like]: `%${crop.trim()}%` } }
            ];
        }

        const farmers = await User.findAll({
            where,
            attributes: ["id", "name", "email", "phone"],
            include: [{
                model: FarmerProfile,
                where: profileWhere,
                required: true
            }],
            limit: 50
        });

        return res.json({
            success: true,
            count: farmers.length,
            data: farmers.map(f => ({
                id: f.id,
                name: f.name,
                phone: f.phone,
                email: f.email,
                district: f.FarmerProfile?.district,
                village: f.FarmerProfile?.village,
                farmSizeAcres: f.FarmerProfile?.farmSizeAcres,
                mainCrop: f.FarmerProfile?.mainCrop,
                customCrop: f.FarmerProfile?.customCrop,
                currentHarvestKg: f.FarmerProfile?.currentHarvestKg,
                productQuantities: f.FarmerProfile?.productQuantities
            }))
        });
    } catch (error) {
        console.error("Get Relevant Farmers error:", error);
        return res.status(500).json({ success: false, message: "Failed to query farmers" });
    }
};

// Discover registered Mandis for Farmers
const getRelevantMandis = async (req, res) => {
    try {
        const { district } = req.query;
        const where = { state: "Maharashtra" };
        if (district && district.trim()) {
            where.district = { [Op.like]: `%${district.trim()}%` };
        }

        const mandis = await MandiProfile.findAll({
            where,
            include: [{
                model: User,
                attributes: ["id", "name", "email", "phone"]
            }],
            limit: 50
        });

        return res.json({
            success: true,
            count: mandis.length,
            data: mandis.map(m => ({
                id: m.id,
                userId: m.userId,
                mandiName: m.mandiName,
                licenseNumber: m.licenseNumber,
                district: m.district,
                state: m.state,
                operatingDays: m.operatingDays,
                contactPhone: m.contactPhone || m.User?.phone,
                contactEmail: m.contactEmail || m.User?.email,
                facilities: m.facilities
            }))
        });
    } catch (error) {
        console.error("Get Relevant Mandis error:", error);
        return res.status(500).json({ success: false, message: "Failed to query mandis" });
    }
};

module.exports = {
    register,
    login,
    getMe,
    demoLogin,
    updateProfile,
    createContactRequest,
    getContactRequests,
    updateContactRequestStatus,
    getRelevantFarmers,
    getRelevantMandis
};
