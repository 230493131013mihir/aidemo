const { User, Crop, Market, MarketPrice, Report } = require("../models");

const overview = async (req, res) => {
    try {
        const [users, crops, markets, marketPrices, openReports] = await Promise.all([
            User.count(),
            Crop.count(),
            Market.count(),
            MarketPrice.count(),
            Report.count({ where: { status: "open" } })
        ]);

        return res.json({
            success: true,
            data: { users, crops, markets, marketPrices, openReports }
        });
    } catch (error) {
        console.error("Admin overview error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load overview" });
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
            limit: 200
        });
        return res.json({ success: true, data: prices });
    } catch (error) {
        console.error("Market price listing error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load market prices" });
    }
};

function normalizePriceInput(body, partial = false) {
    const required = ["marketId", "cropId", "pricePerKg", "pricePerQuintal", "priceDate"];
    if (!partial && required.some((key) => body[key] === undefined || body[key] === "")) {
        return { error: "Market, crop, prices and price date are required" };
    }

    const fields = {};
    for (const key of ["marketId", "cropId"]) {
        if (body[key] !== undefined) {
            const value = Number(body[key]);
            if (!Number.isInteger(value) || value < 1) return { error: `${key} must be a positive integer` };
            fields[key] = value;
        }
    }
    for (const key of ["pricePerKg", "pricePerQuintal", "minPrice", "maxPrice"]) {
        if (body[key] !== undefined && body[key] !== "") {
            const value = Number(body[key]);
            if (!Number.isFinite(value) || value < 0) return { error: `${key} must be a non-negative number` };
            fields[key] = value;
        }
    }
    if (body.priceDate !== undefined) {
        const date = String(body.priceDate);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
            return { error: "priceDate must use YYYY-MM-DD format" };
        }
        fields.priceDate = date;
    }
    if (body.dataType !== undefined) {
        if (!["verified_live", "sample_demo"].includes(body.dataType)) {
            return { error: "dataType must be verified_live or sample_demo" };
        }
        fields.dataType = body.dataType;
    }

    return { fields };
}

const createMarketPrice = async (req, res) => {
    const { fields, error } = normalizePriceInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        const [market, crop] = await Promise.all([
            Market.findByPk(fields.marketId),
            Crop.findByPk(fields.cropId)
        ]);
        if (!market || !crop) {
            return res.status(404).json({ success: false, message: "Market or crop not found" });
        }

        const price = await MarketPrice.create({ ...fields, dataType: fields.dataType || "verified_live" });
        return res.status(201).json({ success: true, data: price });
    } catch (error) {
        console.error("Market price creation error:", error.message);
        const duplicate = error.name === "SequelizeUniqueConstraintError";
        return res.status(duplicate ? 409 : 500).json({
            success: false,
            message: duplicate ? "A price already exists for this crop, market and date" : "Unable to create market price"
        });
    }
};

const updateMarketPrice = async (req, res) => {
    try {
        const price = await MarketPrice.findByPk(req.params.id);
        if (!price) return res.status(404).json({ success: false, message: "Market price not found" });

        const { fields, error } = normalizePriceInput({ ...price.get(), ...req.body }, true);
        if (error) return res.status(400).json({ success: false, message: error });
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, message: "At least one field is required" });
        }

        if (fields.marketId !== undefined && !(await Market.findByPk(fields.marketId))) {
            return res.status(404).json({ success: false, message: "Market not found" });
        }
        if (fields.cropId !== undefined && !(await Crop.findByPk(fields.cropId))) {
            return res.status(404).json({ success: false, message: "Crop not found" });
        }

        await price.update(fields);
        return res.json({ success: true, data: price });
    } catch (error) {
        console.error("Market price update error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update market price" });
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

module.exports = { overview, listMarketPrices, createMarketPrice, updateMarketPrice, reports };