const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, FarmerProfile, TransporterProfile } = require("../models");

function formatUserResponse(userInstance) {
    if (!userInstance) return null;
    const data = userInstance.toJSON ? userInstance.toJSON() : { ...userInstance };
    delete data.password;
    return data;
}

// Ensure farmer profile exists for a user
async function ensureFarmerProfile(userId, defaults = {}) {
    let profile = await FarmerProfile.findOne({ where: { userId } });
    if (!profile) {
        profile = await FarmerProfile.create({
            userId,
            district: defaults.district || "Surat",
            state: defaults.state || "Gujarat",
            village: defaults.village || "Olpad",
            farmSizeAcres: defaults.farmSizeAcres || 4.5,
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
            phone: defaults.phone || "9876543210",
            vehicleType: defaults.vehicleType || "Mahindra Bolero Maxi",
            vehicleNumber: defaults.vehicleNumber || "GJ-05-TR-1001",
            capacityKg: defaults.capacityKg || 2000,
            baseMandi: defaults.baseMandi || "Surat APMC",
            ratePerKm: defaults.ratePerKm || 25,
            isAvailable: true
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
            district,
            state,
            village,
            farmSizeAcres,
            preferredLanguage,
            // Transporter fields
            vehicleType,
            vehicleNumber,
            capacityKg,
            baseMandi,
            ratePerKm
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

        const assignedRole = role === "transporter" ? "transporter" : "farmer";

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

        if (assignedRole === "transporter") {
            transporterProfile = await TransporterProfile.create({
                userId: user.id,
                driverName: name.trim(),
                phone: cleanPhone,
                vehicleType: vehicleType ? vehicleType.trim() : "Mahindra Bolero Maxi",
                vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : `GJ-05-TR-${Math.floor(1000 + Math.random() * 9000)}`,
                capacityKg: capacityKg && !Number.isNaN(Number(capacityKg)) ? Number(capacityKg) : 2000,
                baseMandi: baseMandi ? baseMandi.trim() : (district ? `${district.trim()} APMC` : "Surat APMC"),
                ratePerKm: ratePerKm && !Number.isNaN(Number(ratePerKm)) ? Number(ratePerKm) : 25,
                isAvailable: true
            });
        } else {
            profile = await FarmerProfile.create({
                userId: user.id,
                district: district ? district.trim() : "Surat",
                state: state ? state.trim() : "Gujarat",
                village: village ? village.trim() : "",
                farmSizeAcres: farmSizeAcres && !Number.isNaN(Number(farmSizeAcres)) ? Number(farmSizeAcres) : 3.5,
                mainCrop: req.body.mainCrop ? req.body.mainCrop.trim() : "Tomato",
                currentHarvestKg: req.body.currentHarvestKg ? Number(req.body.currentHarvestKg) : 500,
                preferredLanguage: preferredLanguage || "en"
            });
        }

        return res.status(201).json({
            success: true,
            message: `Account registered successfully as ${assignedRole === "transporter" ? "Transporter" : "Farmer"}! Please login with your credentials.`,
            registeredEmail: user.email,
            role: user.role,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                FarmerProfile: profile,
                TransporterProfile: transporterProfile
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

        const { Op } = require("sequelize");

        // Find user by either email OR 10-digit mobile number
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identifier.toLowerCase() },
                    ...(cleanPhone && cleanPhone.length === 10 ? [{ phone: cleanPhone }] : [])
                ]
            },
            include: [{ model: FarmerProfile }, { model: TransporterProfile }]
        });

        // Specific error if account does not exist
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email or mobile number. Please register first."
            });
        }

        // Verify password
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
            include: [{ model: FarmerProfile }, { model: TransporterProfile }]
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
            include: [{ model: FarmerProfile }]
        });

        if (!user) {
            return res.status(503).json({ success: false, message: "Demo account is not seeded" });
        }

        if (!user.FarmerProfile) {
            const profile = await ensureFarmerProfile(user.id, {
                district: "Surat",
                state: "Gujarat",
                village: "Olpad",
                farmSizeAcres: 4.5,
                preferredLanguage: "gu"
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
            state,
            village,
            farmSizeAcres,
            preferredLanguage
        } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update User table fields
        if (name && name.trim()) user.name = name.trim();
        if (phone !== undefined) user.phone = phone ? phone.trim() : null;
        await user.save();

        // Update or create FarmerProfile for farmer
        if (user.role === "farmer" || district || farmSizeAcres || req.body.mainCrop) {
            let profile = await FarmerProfile.findOne({ where: { userId } });
            if (!profile) {
                profile = await FarmerProfile.create({
                    userId,
                    district: district || "Surat",
                    state: state || "Gujarat",
                    village: village || "",
                    farmSizeAcres: farmSizeAcres ? Number(farmSizeAcres) : 2.5,
                    mainCrop: req.body.mainCrop || "Tomato",
                    currentHarvestKg: req.body.currentHarvestKg ? Number(req.body.currentHarvestKg) : 500,
                    preferredLanguage: preferredLanguage || "en"
                });
            } else {
                if (district !== undefined) profile.district = district.trim();
                if (state !== undefined) profile.state = state.trim();
                if (village !== undefined) profile.village = village.trim();
                if (farmSizeAcres !== undefined && !Number.isNaN(Number(farmSizeAcres))) {
                    profile.farmSizeAcres = Number(farmSizeAcres);
                }
                if (req.body.mainCrop !== undefined) {
                    profile.mainCrop = String(req.body.mainCrop).trim();
                }
                if (req.body.currentHarvestKg !== undefined && !Number.isNaN(Number(req.body.currentHarvestKg))) {
                    profile.currentHarvestKg = Number(req.body.currentHarvestKg);
                }
                if (preferredLanguage !== undefined) {
                    profile.preferredLanguage = preferredLanguage;
                }
                await profile.save();
            }
        }

        // Update or create TransporterProfile for transporter
        if (user.role === "transporter" || req.body.vehicleNumber || req.body.vehicleType) {
            let transProfile = await TransporterProfile.findOne({ where: { userId } });
            if (!transProfile) {
                transProfile = await TransporterProfile.create({
                    userId,
                    driverName: name ? name.trim() : user.name,
                    phone: phone ? phone.trim() : user.phone,
                    vehicleType: req.body.vehicleType ? req.body.vehicleType.trim() : "Mahindra Bolero Maxi Truck",
                    vehicleNumber: req.body.vehicleNumber ? req.body.vehicleNumber.trim().toUpperCase() : "GJ-05-BX-4921",
                    capacityKg: req.body.capacityKg ? Number(req.body.capacityKg) : 2200,
                    baseMandi: req.body.baseMandi ? req.body.baseMandi.trim() : "Surat APMC",
                    ratePerKm: req.body.ratePerKm ? Number(req.body.ratePerKm) : 25,
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

        // Fetch refreshed user with both potential profiles
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ["password"] },
            include: [{ model: FarmerProfile }, { model: TransporterProfile }]
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

module.exports = {
    register,
    login,
    getMe,
    demoLogin,
    updateProfile
};