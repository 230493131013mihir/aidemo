const { User, FarmerProfile, Crop, Market, MarketPrice, TransportRequest, Report } = require("../models");

const overview = async (req, res) => {
    try {
        const [users, farmers, transporters, markets, marketPrices, transportRequests] = await Promise.all([
            User.count(),
            FarmerProfile.count(),
            User.count({ where: { role: "transporter" } }),
            Market.count(),
            MarketPrice.count(),
            TransportRequest.count()
        ]);

        return res.json({
            success: true,
            data: { users, farmers, transporters, markets, marketPrices, transportRequests }
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
        const { role, name, phone, district, state, farmSizeAcres, mainCrop } = req.body;

        const user = await User.findByPk(id, { include: [{ model: FarmerProfile }] });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (role) {
            const allowed = ["farmer", "transporter", "admin"];
            if (!allowed.includes(role)) {
                return res.status(400).json({ success: false, message: `role must be one of ${allowed.join(", ")}` });
            }
            if (id === req.user.id && role !== "admin") {
                return res.status(400).json({ success: false, message: "Admin cannot demote own account" });
            }
            user.role = role;
        }

        if (name && name.trim()) user.name = name.trim();
        if (phone !== undefined) user.phone = phone ? phone.trim() : null;
        await user.save();

        if (user.FarmerProfile) {
            if (district) user.FarmerProfile.district = district.trim();
            if (state) user.FarmerProfile.state = state.trim();
            if (farmSizeAcres) user.FarmerProfile.farmSizeAcres = Number(farmSizeAcres);
            if (mainCrop) user.FarmerProfile.mainCrop = mainCrop.trim();
            await user.FarmerProfile.save();
        }

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

        await user.destroy();
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
        const price = await MarketPrice.findByPk(req.params.id);
        if (!price) return res.status(404).json({ success: false, message: "Market price not found" });

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
        return res.json({ success: true, data: refreshed });
    } catch (error) {
        console.error("Market price update error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update market price" });
    }
};

const deleteMarketPrice = async (req, res) => {
    try {
        const price = await MarketPrice.findByPk(req.params.id);
        if (!price) return res.status(404).json({ success: false, message: "Market price record not found" });
        await price.destroy();
        return res.json({ success: true, message: "Market price record deleted successfully" });
    } catch (error) {
        console.error("Market price deletion error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to delete market price" });
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
    listMarkets,
    listCrops,
    reports
};
