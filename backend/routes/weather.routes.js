const express = require("express");
const { getWeatherForecast } = require("../services/weatherService");

const router = express.Router();

router.get("/forecast", async (req, res) => {
    try {
        const result = await getWeatherForecast(req.query);
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("Weather forecast error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to load weather forecast"
        });
    }
});

module.exports = router;
