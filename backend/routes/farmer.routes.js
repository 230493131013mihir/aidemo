/**
 * farmer.routes.js
 * Dedicated routes for Dynamic Farmer Crops, Harvest Quantities, Mandi Prices & Revenue
 * HarvestMitra AI
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const farmerController = require('../controllers/farmer.controller');
const saleController = require('../controllers/saleController');

const requireFarmer = (req, res, next) => {
  if (req.user?.role !== 'farmer' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Crop management is restricted to farmer accounts.' });
  }
  next();
};

// All farmer crop endpoints are protected with authMiddleware and requireFarmer
router.get('/crops', authMiddleware, requireFarmer, farmerController.getCrops);
router.post('/crops', authMiddleware, requireFarmer, farmerController.addCrop);
router.put('/crops/:cropName', authMiddleware, requireFarmer, farmerController.updateCropQuantity);
router.delete('/crops/:cropName', authMiddleware, requireFarmer, farmerController.removeCrop);
router.get('/market-prices', authMiddleware, requireFarmer, farmerController.getFarmerMarketPrices);
router.get('/revenue-summary', authMiddleware, requireFarmer, farmerController.getRevenueSummary);

// Farmer Sale History & Profit Report endpoints
router.get('/sales', authMiddleware, requireFarmer, saleController.getSaleRecords);
router.post('/sales', authMiddleware, requireFarmer, saleController.createSaleRecord);
router.put('/sales/:id', authMiddleware, requireFarmer, saleController.updateSaleRecord);
router.delete('/sales/:id', authMiddleware, requireFarmer, saleController.deleteSaleRecord);
router.get('/sales/summary', authMiddleware, requireFarmer, saleController.getProfitSummary);
router.post('/sales/seed-demo', authMiddleware, requireFarmer, saleController.seedDemoSales);

module.exports = router;
