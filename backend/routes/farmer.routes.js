/**
 * farmer.routes.js
 * Dedicated routes for Dynamic Farmer Crops, Harvest Quantities, Mandi Prices & Revenue
 * HarvestMitra AI
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const farmerController = require('../controllers/farmer.controller');

// All farmer crop endpoints are protected with authMiddleware
router.get('/crops', authMiddleware, farmerController.getCrops);
router.post('/crops', authMiddleware, farmerController.addCrop);
router.put('/crops/:cropName', authMiddleware, farmerController.updateCropQuantity);
router.delete('/crops/:cropName', authMiddleware, farmerController.removeCrop);
router.get('/market-prices', authMiddleware, farmerController.getFarmerMarketPrices);
router.get('/revenue-summary', authMiddleware, farmerController.getRevenueSummary);

module.exports = router;
