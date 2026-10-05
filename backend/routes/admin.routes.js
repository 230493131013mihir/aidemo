const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const {
    overview,
    listMarketPrices,
    createMarketPrice,
    updateMarketPrice,
    reports
} = require("../controllers/admin.controller");

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get("/overview", overview);
router.get("/market-prices", listMarketPrices);
router.post("/market-prices", createMarketPrice);
router.put("/market-prices/:id", updateMarketPrice);
router.get("/reports", reports);

module.exports = router;