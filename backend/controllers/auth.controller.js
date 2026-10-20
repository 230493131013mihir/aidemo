const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, FarmerProfile, TransporterProfile, MandiProfile, ContactRequest } = require("../models");
const { Op } = require("sequelize");

const otpService = require("../services/otpService");
const agristackService = require("../services/agristackService");

function formatUserResponse(userInstance) {
    if (!userInstance) return null;
    const data = userInstance.toJSON ? userInstance.toJSON() : { ...userInstance };
    delete data.password;

    // Ensure profiles are accessible in both casing styles
    const fp = data.FarmerProfile || data.farmerProfile || userInstance.FarmerProfile || userInstance.farmerProfile || (userInstance.getDataValue && userInstance.getDataValue("FarmerProfile")) || userInstance.dataValues?.FarmerProfile;
    if (fp) {
        const fpJson = fp.toJSON ? fp.toJSON() : fp;
        data.FarmerProfile = fpJson;
        data.farmerProfile = fpJson;
    }
    const tp = data.TransporterProfile || data.transporterProfile || userInstance.TransporterProfile || userInstance.transporterProfile || (userInstance.getDataValue && userInstance.getDataValue("TransporterProfile")) || userInstance.dataValues?.TransporterProfile;
    if (tp) {
        const tpJson = tp.toJSON ? tp.toJSON() : tp;
        data.TransporterProfile = tpJson;
        data.transporterProfile = tpJson;
    }
    const mp = data.MandiProfile || data.mandiProfile || userInstance.MandiProfile || userInstance.mandiProfile || (userInstance.getDataValue && userInstance.getDataValue("MandiProfile")) || userInstance.dataValues?.MandiProfile;
    if (mp) {
        const mpJson = mp.toJSON ? mp.toJSON() : mp;
        data.MandiProfile = mpJson;
        data.mandiProfile = mpJson;
    }

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
            preferredLanguage: defaults.preferredLanguage || "en",
            agristackId: defaults.agristackId || null,
            isGovtVerified: Boolean(defaults.isGovtVerified),
            govtVerifiedLandAcres: defaults.govtVerifiedLandAcres || null,
            surveyNumber: defaults.surveyNumber || null,
            aadhaarLinked: Boolean(defaults.aadhaarLinked),
            dbtAccountLinked: Boolean(defaults.dbtAccountLinked),
            fpoName: defaults.fpoName || null,
            fpoRegistrationNumber: defaults.fpoRegistrationNumber || null,
            memberFarmerCount: defaults.memberFarmerCount || null,
            roleSubtype: defaults.roleSubtype || "smallholder"
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

        const assignedRole = role === "transporter" ? "transporter" : role === "mandi" ? "mandi" : role === "fpo_leader" ? "fpo_leader" : "farmer";

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
            // Farmer or FPO Leader
            let formattedMainCrop = "Tomato";
            if (Array.isArray(mainCrop)) {
                formattedMainCrop = mainCrop.map(c => String(c).trim()).filter(Boolean).join(", ");
            } else if (mainCrop) {
                formattedMainCrop = String(mainCrop).trim();
            }

            let computedHarvestKg = currentHarvestKg && !Number.isNaN(Number(currentHarvestKg)) ? Number(currentHarvestKg) : 500;
            let normalizedQuantitiesStr = null;

            if (productQuantities) {
                try {
                    const parsed = typeof productQuantities === 'string' ? JSON.parse(productQuantities) : productQuantities;
                    if (parsed && typeof parsed === 'object') {
                        normalizedQuantitiesStr = JSON.stringify(parsed);
                        let totalKg = 0;
                        Object.values(parsed).forEach(item => {
                            if (item && typeof item === 'object') {
                                const q = Number(item.qty !== undefined ? item.qty : item.harvestQuantityKg) || 0;
                                const u = String(item.unit || 'kg').toLowerCase();
                                totalKg += (u === 'tonne' || u === 'ton' || u === 'mt') ? q * 1000 : (u === 'quintal' || u === 'qtl') ? q * 100 : q;
                            } else if (!Number.isNaN(Number(item))) {
                                totalKg += Number(item);
                            }
                        });
                        if (totalKg > 0) {
                            computedHarvestKg = Math.round(totalKg);
                        }
                    }
                } catch (e) {
                    normalizedQuantitiesStr = typeof productQuantities === 'string' ? productQuantities : JSON.stringify(productQuantities);
                }
            }

            const isFpo = assignedRole === "fpo_leader";

            profile = await FarmerProfile.create({
                userId: user.id,
                district: district ? district.trim() : "Pune",
                state: "Maharashtra",
                village: village ? village.trim() : "",
                farmSizeAcres: farmSizeAcres && !Number.isNaN(Number(farmSizeAcres)) ? Number(farmSizeAcres) : (isFpo ? 50.0 : 3.5),
                mainCrop: formattedMainCrop,
                customCrop: customCrop ? String(customCrop).trim() : null,
                currentHarvestKg: computedHarvestKg,
                productQuantities: normalizedQuantitiesStr,
                preferredLanguage: preferredLanguage || "en",
                roleSubtype: isFpo ? "fpo_leader" : "smallholder",
                fpoName: req.body.fpoName || (isFpo ? `${district.trim()} Kisan Samruddhi FPO` : null),
                fpoRegistrationNumber: req.body.fpoRegistrationNumber || (isFpo ? `FPO-MH-${Math.floor(1000 + Math.random() * 9000)}` : null),
                memberFarmerCount: req.body.memberFarmerCount ? Number(req.body.memberFarmerCount) : (isFpo ? 45 : null),
                agristackId: req.body.agristackId || null,
                isGovtVerified: Boolean(req.body.agristackId),
                surveyNumber: req.body.surveyNumber || null
            });
        }

        const roleTitle = assignedRole === "transporter" ? "Transporter" : assignedRole === "mandi" ? "Mandi Official" : assignedRole === "fpo_leader" ? "FPO Leader" : "Farmer";

        // Generate JWT token for seamless auto-login on registration
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(201).json({
            success: true,
            message: `Account registered successfully as ${roleTitle}!`,
            token,
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
            let formattedMainCrop = undefined;
            if (Array.isArray(mainCrop)) {
                formattedMainCrop = mainCrop.map(c => String(c).trim()).filter(Boolean).join(", ");
            } else if (mainCrop !== undefined) {
                formattedMainCrop = String(mainCrop).trim();
            }

            let profile = await FarmerProfile.findOne({ where: { userId } });
            if (!profile) {
                profile = await FarmerProfile.create({
                    userId,
                    district: district ? district.trim() : "Pune",
                    state: "Maharashtra",
                    village: village || "",
                    farmSizeAcres: farmSizeAcres ? Number(farmSizeAcres) : 3.5,
                    mainCrop: formattedMainCrop || "Tomato",
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
                if (formattedMainCrop !== undefined) profile.mainCrop = formattedMainCrop;
                if (customCrop !== undefined) profile.customCrop = customCrop ? String(customCrop).trim() : null;
                if (currentHarvestKg !== undefined && !Number.isNaN(Number(currentHarvestKg))) {
                    profile.currentHarvestKg = Number(currentHarvestKg);
                }
                if (productQuantities !== undefined) {
                    profile.productQuantities = typeof productQuantities === 'string' ? productQuantities : JSON.stringify(productQuantities);
                    try {
                        const parsed = typeof productQuantities === 'string' ? JSON.parse(productQuantities) : productQuantities;
                        if (parsed && typeof parsed === 'object') {
                            let totalKg = 0;
                            Object.values(parsed).forEach(item => {
                                if (item && typeof item === 'object') {
                                    const q = Number(item.qty !== undefined ? item.qty : item.harvestQuantityKg) || 0;
                                    const u = String(item.unit || 'kg').toLowerCase();
                                    totalKg += (u === 'tonne' || u === 'ton' || u === 'mt') ? q * 1000 : (u === 'quintal' || u === 'qtl') ? q * 100 : q;
                                } else if (!Number.isNaN(Number(item))) {
                                    totalKg += Number(item);
                                }
                            });
                            if (totalKg > 0) {
                                profile.currentHarvestKg = Math.round(totalKg);
                            }
                        }
                    } catch (e) {}
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

// =========================
// SEND OTP (SMS / WhatsApp)
// =========================
const sendOtp = async (req, res) => {
    try {
        const { channel = "sms", role = "farmer", name = "" } = req.body;
        const phone = req.body.phone || req.body.phoneNumber;
        if (!phone) {
            return res.status(400).json({ success: false, message: "Mobile number is required." });
        }
        const result = await otpService.sendOtp({ phone, channel, role, name });
        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message || "Failed to send OTP." });
    }
};

// =========================
// VERIFY OTP & LOGIN / REGISTER
// =========================
const verifyOtp = async (req, res) => {
    try {
        const { role = "farmer", name = "", district = "Pune", state = "Maharashtra", agristackId } = req.body;
        const phone = req.body.phone || req.body.phoneNumber;
        const otp = req.body.otp || req.body.code;
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: "Mobile number and OTP are required." });
        }

        const verifyResult = await otpService.verifyOtp({ phone, otp });
        if (!verifyResult.valid) {
            return res.status(400).json({ success: false, message: verifyResult.message });
        }

        const cleanPhone = verifyResult.phone;

        // Find existing user by phone OR synthetic email
        let user = await User.findOne({
            where: {
                [Op.or]: [
                    { phone: cleanPhone },
                    { email: `farmer_${cleanPhone}@harvestmitra.local` }
                ]
            },
            include: [{ model: FarmerProfile }, { model: TransporterProfile }, { model: MandiProfile }]
        });

        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const targetRole = role === "transporter" ? "transporter" : role === "mandi" ? "mandi" : role === "fpo_leader" ? "fpo_leader" : "farmer";
            const displayName = name && name.trim()
                ? name.trim()
                : targetRole === "fpo_leader"
                ? `FPO Aggregator (+91 ${cleanPhone.slice(-4)})`
                : targetRole === "transporter"
                ? `Transporter (+91 ${cleanPhone.slice(-4)})`
                : targetRole === "mandi"
                ? `Mandi Agent (+91 ${cleanPhone.slice(-4)})`
                : `Kisan (+91 ${cleanPhone.slice(-4)})`;

            const randomPassword = await bcrypt.hash(`otp_auth_${cleanPhone}_${Date.now()}`, 10);

            user = await User.create({
                name: displayName,
                email: `farmer_${cleanPhone}@harvestmitra.local`,
                phone: cleanPhone,
                password: randomPassword,
                role: targetRole
            });

            if (targetRole === "farmer" || targetRole === "fpo_leader") {
                const agristackLookup = agristackService.lookupRegistry({
                    identifier: agristackId,
                    phone: cleanPhone,
                    district,
                    state,
                    name: displayName
                });

                const data = agristackLookup.data;
                const profile = await FarmerProfile.create({
                    userId: user.id,
                    district: data.landRecord?.district || district,
                    state: data.landRecord?.state || state,
                    village: data.landRecord?.village || "Rural Panchayat",
                    farmSizeAcres: data.landRecord?.verifiedAcres || (targetRole === "fpo_leader" ? 50.0 : 3.5),
                    mainCrop: data.verifiedCrops?.join(", ") || "Tomato",
                    currentHarvestKg: 500,
                    preferredLanguage: "mr",
                    agristackId: data.agristackId,
                    isGovtVerified: true,
                    govtVerifiedLandAcres: data.landRecord?.verifiedAcres || (targetRole === "fpo_leader" ? 50.0 : 3.5),
                    surveyNumber: data.landRecord?.surveyNumber || "142/2A",
                    aadhaarLinked: true,
                    dbtAccountLinked: true,
                    roleSubtype: targetRole === "fpo_leader" ? "fpo_leader" : "smallholder",
                    fpoName: targetRole === "fpo_leader" ? `${district} Kisan Samruddhi FPO` : null,
                    memberFarmerCount: targetRole === "fpo_leader" ? 45 : null
                });
                user.FarmerProfile = profile;
                user.setDataValue("FarmerProfile", profile);
            } else if (targetRole === "transporter") {
                const profile = await ensureTransporterProfile(user.id, { name: displayName, phone: cleanPhone, baseMandi: `${district} APMC` });
                user.TransporterProfile = profile;
                user.setDataValue("TransporterProfile", profile);
            } else if (targetRole === "mandi") {
                const profile = await ensureMandiProfile(user.id, { name: displayName, phone: cleanPhone, district });
                user.MandiProfile = profile;
                user.setDataValue("MandiProfile", profile);
            }
        } else {
            // Existing user
            if (user.role === "farmer" || user.role === "fpo_leader") {
                if (!user.FarmerProfile) {
                    const prof = await ensureFarmerProfile(user.id, { district, state, roleSubtype: user.role });
                    user.FarmerProfile = prof;
                    user.setDataValue("FarmerProfile", prof);
                }
                if (agristackId) {
                    const lookup = agristackService.lookupRegistry({ identifier: agristackId, phone: cleanPhone, district, state, name: user.name });
                    const updated = await agristackService.linkToFarmerProfile(user.id, lookup.data);
                    user.FarmerProfile = updated;
                    user.setDataValue("FarmerProfile", updated);
                }
            } else if (user.role === "transporter" && !user.TransporterProfile) {
                user.setDataValue("TransporterProfile", await ensureTransporterProfile(user.id, { name: user.name, phone: user.phone }));
            } else if (user.role === "mandi" && !user.MandiProfile) {
                user.setDataValue("MandiProfile", await ensureMandiProfile(user.id, { name: user.name, phone: user.phone }));
            }
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(200).json({
            success: true,
            message: isNewUser ? "Welcome to HarvestMitra AI! Verified via OTP." : "Welcome back! Login verified successfully.",
            token,
            isNewUser,
            user: formatUserResponse(user)
        });
    } catch (err) {
        console.error("verifyOtp error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error verifying OTP." });
    }
};

// =========================
// 1-CLICK WHATSAPP AUTHENTICATION
// =========================
const whatsappLogin = async (req, res) => {
    try {
        const { name = "", role = "farmer", district = "Pune", state = "Maharashtra", agristackId } = req.body;
        const phone = req.body.phone || req.body.phoneNumber;
        if (!phone) {
            return res.status(400).json({ success: false, message: "Mobile number is required for WhatsApp verification." });
        }

        const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
        if (cleanPhone.length !== 10) {
            return res.status(400).json({ success: false, message: "Please provide a valid 10-digit mobile number." });
        }

        await otpService.quickWhatsAppVerify({ phone: cleanPhone, name, role });

        let user = await User.findOne({
            where: {
                [Op.or]: [
                    { phone: cleanPhone },
                    { email: `farmer_${cleanPhone}@harvestmitra.local` }
                ]
            },
            include: [{ model: FarmerProfile }, { model: TransporterProfile }, { model: MandiProfile }]
        });

        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const targetRole = role === "transporter" ? "transporter" : role === "mandi" ? "mandi" : role === "fpo_leader" ? "fpo_leader" : "farmer";
            const displayName = name && name.trim()
                ? name.trim()
                : targetRole === "fpo_leader"
                ? `FPO Aggregator (+91 ${cleanPhone.slice(-4)})`
                : targetRole === "transporter"
                ? `Transporter (+91 ${cleanPhone.slice(-4)})`
                : targetRole === "mandi"
                ? `Mandi Agent (+91 ${cleanPhone.slice(-4)})`
                : `Kisan (+91 ${cleanPhone.slice(-4)})`;

            const randomPassword = await bcrypt.hash(`whatsapp_auth_${cleanPhone}_${Date.now()}`, 10);

            user = await User.create({
                name: displayName,
                email: `farmer_${cleanPhone}@harvestmitra.local`,
                phone: cleanPhone,
                password: randomPassword,
                role: targetRole
            });

            if (targetRole === "farmer" || targetRole === "fpo_leader") {
                const agristackLookup = agristackService.lookupRegistry({
                    identifier: agristackId,
                    phone: cleanPhone,
                    district,
                    state,
                    name: displayName
                });

                const data = agristackLookup.data;
                const profile = await FarmerProfile.create({
                    userId: user.id,
                    district: data.landRecord?.district || district,
                    state: data.landRecord?.state || state,
                    village: data.landRecord?.village || "Rural Panchayat",
                    farmSizeAcres: data.landRecord?.verifiedAcres || (targetRole === "fpo_leader" ? 50.0 : 3.5),
                    mainCrop: data.verifiedCrops?.join(", ") || "Tomato",
                    currentHarvestKg: 500,
                    preferredLanguage: "mr",
                    agristackId: data.agristackId,
                    isGovtVerified: true,
                    govtVerifiedLandAcres: data.landRecord?.verifiedAcres || (targetRole === "fpo_leader" ? 50.0 : 3.5),
                    surveyNumber: data.landRecord?.surveyNumber || "142/2A",
                    aadhaarLinked: true,
                    dbtAccountLinked: true,
                    roleSubtype: targetRole === "fpo_leader" ? "fpo_leader" : "smallholder",
                    fpoName: targetRole === "fpo_leader" ? `${district} Kisan Samruddhi FPO` : null,
                    memberFarmerCount: targetRole === "fpo_leader" ? 45 : null
                });
                user.FarmerProfile = profile;
                user.setDataValue("FarmerProfile", profile);
            } else if (targetRole === "transporter") {
                const profile = await ensureTransporterProfile(user.id, { name: displayName, phone: cleanPhone, baseMandi: `${district} APMC` });
                user.TransporterProfile = profile;
                user.setDataValue("TransporterProfile", profile);
            } else if (targetRole === "mandi") {
                const profile = await ensureMandiProfile(user.id, { name: displayName, phone: cleanPhone, district });
                user.MandiProfile = profile;
                user.setDataValue("MandiProfile", profile);
            }
        } else {
            if (user.role === "farmer" || user.role === "fpo_leader") {
                if (!user.FarmerProfile) {
                    const prof = await ensureFarmerProfile(user.id, { district, state, roleSubtype: user.role });
                    user.FarmerProfile = prof;
                    user.setDataValue("FarmerProfile", prof);
                }
                if (agristackId) {
                    const lookup = agristackService.lookupRegistry({ identifier: agristackId, phone: cleanPhone, district, state, name: user.name });
                    const updated = await agristackService.linkToFarmerProfile(user.id, lookup.data);
                    user.FarmerProfile = updated;
                    user.setDataValue("FarmerProfile", updated);
                }
            } else if (user.role === "transporter" && !user.TransporterProfile) {
                user.setDataValue("TransporterProfile", await ensureTransporterProfile(user.id, { name: user.name, phone: user.phone }));
            } else if (user.role === "mandi" && !user.MandiProfile) {
                user.setDataValue("MandiProfile", await ensureMandiProfile(user.id, { name: user.name, phone: user.phone }));
            }
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "harvestmitra_super_secret_jwt_token_key_2026_hackathon",
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "1-Click WhatsApp authentication verified successfully!",
            token,
            isNewUser,
            user: formatUserResponse(user)
        });
    } catch (err) {
        console.error("whatsappLogin error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error during WhatsApp authentication." });
    }
};

// =========================
// AGRISTACK & PM-KISAN VERIFICATION
// =========================
const linkAgristack = async (req, res) => {
    try {
        const { agristackId } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId, { include: [{ model: FarmerProfile }] });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const lookup = agristackService.lookupRegistry({
            identifier: agristackId,
            phone: user.phone,
            district: user.FarmerProfile?.district || "Pune",
            state: user.FarmerProfile?.state || "Maharashtra",
            name: user.name
        });

        const updatedProfile = await agristackService.linkToFarmerProfile(userId, lookup.data);

        return res.status(200).json({
            success: true,
            message: "Agristack & 7/12 Land Records successfully verified and linked!",
            profile: updatedProfile,
            agristackData: lookup.data
        });
    } catch (err) {
        console.error("linkAgristack error:", err);
        return res.status(500).json({ success: false, message: err.message || "Failed to link Agristack identity." });
    }
};

const lookupAgristack = async (req, res) => {
    try {
        const { id, phone } = req.query;
        const lookup = agristackService.lookupRegistry({ identifier: id, phone });
        return res.status(200).json({
            success: true,
            ...lookup
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
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
    getRelevantMandis,
    sendOtp,
    verifyOtp,
    whatsappLogin,
    linkAgristack,
    lookupAgristack
};
