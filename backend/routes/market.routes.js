const express = require("express");
const { listPublicMarketPrices } = require("../services/marketPriceService");

const router = express.Router();

router.get("/prices", async (req, res) => {
    try {
        const result = await listPublicMarketPrices(req.query);
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("Public market prices error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to load market prices"
        });
    }
});

module.exports = router;
