const { User, FarmerProfile, Crop, Market, MarketPrice, TransportRequest, Report, AuditLog } = require("../models");
const { recordAudit } = require("../services/auditService");

const overview = async (req, res) => {
    try {
        const [users, farmers, transporters, markets, marketPrices, transportRequests, auditLogs] = await Promise.all([
            User.count(),
            FarmerProfile.count(),
            User.count({ where: { role: "transporter" } }),
            Market.count(),
            MarketPrice.count(),
            TransportRequest.count(),
            AuditLog.count()
        ]);

        return res.json({
            success: true,
            data: { users, farmers, transporters, markets, marketPrices, transportRequests, auditLogs }
        });
    } catch (error) {
        console.error("Admin overview error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load overview" });
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password"] },
            include: [{ model: FarmerProfile }],
            order: [["createdAt", "DESC"]],
            limit: 200
        });
        return res.json({ success: true, data: users });
    } catch (error) {
        console.error("Admin user listing error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load users" });
    }
};

const updateUser = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { role, name, phone, district, state, farmSizeAcres, mainCrop, status } = req.body;

        const user = await User.findByPk(id, { include: [{ model: FarmerProfile }] });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const changes = [];

        if (status) {
            const allowedStatus = ["active", "suspended", "disabled"];
            if (!allowedStatus.includes(status)) {
                return res.status(400).json({ success: false, message: `status must be one of ${allowedStatus.join(", ")}` });
            }
            if (id === req.user.id && (status === "suspended" || status === "disabled")) {
                return res.status(400).json({ success: false, message: "Admin cannot deactivate own account" });
            }
            if (user.status !== status) {
                changes.push(`status: ${user.status || 'active'} -> ${status}`);
                user.status = status;
            }
        }

        if (role) {
            const allowed = ["farmer", "transporter", "admin", "mandi"];
            if (!allowed.includes(role)) {
                return res.status(400).json({ success: false, message: `role must be one of ${allowed.join(", ")}` });
            }
            if (id === req.user.id && role !== "admin") {
                return res.status(400).json({ success: false, message: "Admin cannot demote own account" });
            }
            if (user.role !== role) {
                changes.push(`role: ${user.role} -> ${role}`);
                user.role = role;
            }
        }

        if (name && name.trim() && user.name !== name.trim()) {
            changes.push(`name: ${user.name} -> ${name.trim()}`);
            user.name = name.trim();
        }
        if (phone !== undefined) user.phone = phone ? phone.trim() : null;
        await user.save();

        if (user.FarmerProfile) {
            if (district) user.FarmerProfile.district = district.trim();
            if (state) user.FarmerProfile.state = state.trim();
            if (farmSizeAcres) user.FarmerProfile.farmSizeAcres = Number(farmSizeAcres);
            if (mainCrop) user.FarmerProfile.mainCrop = mainCrop.trim();
            await user.FarmerProfile.save();
        }

        await recordAudit(req, {
            action: status ? "USER_STATUS_UPDATE" : "USER_PROFILE_UPDATE",
            targetType: "user",
            targetId: id,
            details: { targetName: user.name, targetEmail: user.email, changes: changes.join(", ") || "profile updated" }
        });

        const refreshed = await User.findByPk(id, {
            attributes: { exclude: ["password"] },
            include: [{ model: FarmerProfile }]
        });

        return res.json({ success: true, data: refreshed });
    } catch (error) {
        console.error("Admin user update error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update user" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: "Admin cannot delete own account" });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const targetEmail = user.email;
        const targetName = user.name;
        await user.destroy();

        await recordAudit(req, {
            action: "USER_DELETE",
            targetType: "user",
            targetId: id,
            details: { targetName, targetEmail }
        });

        return res.json({ success: true, message: "User deleted" });
    } catch (error) {
        console.error("Admin user delete error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete user" });
    }
};

const listMarketPrices = async (req, res) => {
    try {
        const prices = await MarketPrice.findAll({
            include: [
                { model: Market, attributes: ["id", "name", "district", "state"] },
                { model: Crop, attributes: ["id", "nameEn", "nameGu", "nameHi"] }
            ],
            order: [["priceDate", "DESC"], ["id", "DESC"]],
            limit: 300
        });
        return res.json({ success: true, data: prices });
    } catch (error) {
        console.error("Market price listing error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load market prices" });
    }
};

const createMarketPrice = async (req, res) => {
    try {
        const { marketId, cropId, pricePerQuintal, pricePerKg, minPrice, maxPrice, priceDate } = req.body;

        if (!marketId || !cropId || !pricePerQuintal) {
            return res.status(400).json({ success: false, message: "Market, Crop, and Modal Price per Quintal are required." });
        }

        const [market, crop] = await Promise.all([
            Market.findByPk(marketId),
            Crop.findByPk(cropId)
        ]);

        if (!market || !crop) {
            return res.status(404).json({ success: false, message: "Selected market or crop was not found." });
        }

        const quintal = Number(pricePerQuintal);
        const kg = Number(pricePerKg) || Number((quintal / 100).toFixed(2));
        const min = Number(minPrice) || Number((quintal * 0.92).toFixed(0));
        const max = Number(maxPrice) || Number((quintal * 1.08).toFixed(0));
        const date = priceDate || new Date().toISOString().slice(0, 10);

        let record = await MarketPrice.findOne({
            where: { marketId, cropId, priceDate: date }
        });

        if (record) {
            await record.update({
                pricePerQuintal: quintal,
                pricePerKg: kg,
                minPrice: min,
                maxPrice: max,
                dataType: "verified_live"
            });
        } else {
            record = await MarketPrice.create({
                marketId,
                cropId,
                pricePerQuintal: quintal,
                pricePerKg: kg,
                minPrice: min,
                maxPrice: max,
                priceDate: date,
                dataType: "verified_live"
            });
        }

        const refreshed = await MarketPrice.findByPk(record.id, {
            include: [Market, Crop]
        });

        await recordAudit(req, {
            action: "PRICE_CREATE_UPDATE",
            targetType: "market_price",
            targetId: record.id,
            details: {
                crop: crop.nameEn,
                market: market.name,
                district: market.district,
                state: market.state,
                pricePerQuintal: quintal,
                pricePerKg: kg,
                priceDate: date
            }
        });

        return res.status(201).json({
            success: true,
            message: `Market price for ${crop.nameEn} in ${market.name} saved successfully to MySQL.`,
            data: refreshed
        });
    } catch (error) {
        console.error("Market price creation error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to save market price"
        });
    }
};

const updateMarketPrice = async (req, res) => {
    try {
        const price = await MarketPrice.findByPk(req.params.id, { include: [Market, Crop] });
        if (!price) return res.status(404).json({ success: false, message: "Market price not found" });

        const oldQuintal = price.pricePerQuintal;
        const { pricePerQuintal, pricePerKg, minPrice, maxPrice } = req.body;
        if (pricePerQuintal) {
            const quintal = Number(pricePerQuintal);
            price.pricePerQuintal = quintal;
            price.pricePerKg = Number(pricePerKg) || Number((quintal / 100).toFixed(2));
            price.minPrice = Number(minPrice) || Number((quintal * 0.92).toFixed(0));
            price.maxPrice = Number(maxPrice) || Number((quintal * 1.08).toFixed(0));
        }

        await price.save();
        const refreshed = await MarketPrice.findByPk(price.id, { include: [Market, Crop] });

        await recordAudit(req, {
            action: "PRICE_UPDATE",
            targetType: "market_price",
            targetId: price.id,
            details: {
                crop: price.Crop?.nameEn,
                market: price.Market?.name,
                oldPricePerQuintal: oldQuintal,
                newPricePerQuintal: price.pricePerQuintal,
                pricePerKg: price.pricePerKg
            }
        });

        return res.json({ success: true, data: refreshed });
    } catch (error) {
        console.error("Market price update error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update market price" });
    }
};

const deleteMarketPrice = async (req, res) => {
    try {
        const price = await MarketPrice.findByPk(req.params.id, { include: [Market, Crop] });
        if (!price) return res.status(404).json({ success: false, message: "Market price record not found" });

        const details = {
            crop: price.Crop?.nameEn,
            market: price.Market?.name,
            pricePerQuintal: price.pricePerQuintal,
            priceDate: price.priceDate
        };

        await price.destroy();

        await recordAudit(req, {
            action: "PRICE_DELETE",
            targetType: "market_price",
            targetId: req.params.id,
            details
        });

        return res.json({ success: true, message: "Market price record deleted successfully" });
    } catch (error) {
        console.error("Market price deletion error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete market price" });
    }
};

const listAuditLogs = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const { count, rows } = await AuditLog.findAndCountAll({
            order: [["createdAt", "DESC"]],
            limit,
            offset
        });

        return res.json({
            success: true,
            total: count,
            page,
            totalPages: Math.ceil(count / limit) || 1,
            data: rows
        });
    } catch (error) {
        console.error("Admin audit log error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load audit logs" });
    }
};

const listMarkets = async (req, res) => {
    try {
        const markets = await Market.findAll({
            order: [["state", "ASC"], ["name", "ASC"]]
        });
        return res.json({ success: true, data: markets });
    } catch (error) {
        console.error("Admin list markets error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load markets" });
    }
};

const listCrops = async (req, res) => {
    try {
        const crops = await Crop.findAll({
            order: [["nameEn", "ASC"]]
        });
        return res.json({ success: true, data: crops });
    } catch (error) {
        console.error("Admin list crops error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load crops" });
    }
};

const reports = async (req, res) => {
    try {
        const data = await Report.findAll({
            include: [{ model: User, attributes: ["id", "name", "email"] }],
            order: [["createdAt", "DESC"]],
            limit: 200
        });
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Admin reports error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load reports" });
    }
};

module.exports = {
    overview,
    listUsers,
    updateUser,
    deleteUser,
    listMarketPrices,
    createMarketPrice,
    updateMarketPrice,
    deleteMarketPrice,
    listAuditLogs,
    listMarkets,
    listCrops,
    reports
};
