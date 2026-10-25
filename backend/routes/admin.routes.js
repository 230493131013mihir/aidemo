const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const {
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
    reports,
    listAuditLogs
} = require("../controllers/admin.controller");

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get("/overview", overview);
router.get("/users", listUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/market-prices", listMarketPrices);
router.post("/market-prices", createMarketPrice);
router.put("/market-prices/:id", updateMarketPrice);
router.delete("/market-prices/:id", deleteMarketPrice);

router.get("/markets", listMarkets);
router.get("/crops", listCrops);
router.get("/reports", reports);
router.get("/audit-logs", listAuditLogs);

module.exports = router;
