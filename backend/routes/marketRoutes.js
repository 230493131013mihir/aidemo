/**
 * marketRoutes.js
 * Express router for Market Explorer endpoints
 * HarvestMitra AI - ISSUE-11
 */

const express = require('express');
const router = express.Router();
const {
  handleGetMarkets,
  handleGetCrops,
  handleGetMarketPrices,
  handleGetPriceTrends,
  handleCompareMarkets,
  handleSyncMarketPrices,
  handleGetSyncStatus,
  handleGetMovingAverageTrends,
  handleSimulatePriceAlert,
  handleGetActivePriceAlerts,
  handleDispatchPriceAlert
} = require('../controllers/marketController');

const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Base Market & Crop Exploration
router.get('/', handleGetMarkets);
router.get('/crops', handleGetCrops);
router.get('/prices', handleGetMarketPrices);
router.get('/prices/trends', handleGetPriceTrends);
router.get('/compare', handleCompareMarkets);

// ISSUE #76: APMC Auto-Sync & Moving Average Trend Aggregator
const { getMandiPriceTrends } = require('../services/mandiSyncService');
const { generatePriceAlerts } = require('../services/alertEngine');

router.post('/sync', authMiddleware, adminMiddleware, handleSyncMarketPrices);
router.get('/sync', authMiddleware, adminMiddleware, handleSyncMarketPrices);
router.get('/sync-status', handleGetSyncStatus);
router.get('/trends/moving-average', handleGetMovingAverageTrends);
router.get('/prices/moving-average', handleGetMovingAverageTrends);
router.get('/analytics/trends', async (req, res) => {
  const crop = req.query.crop || 'Tomato';
  const state = req.query.state || 'Maharashtra';
  const data = await getMandiPriceTrends(crop, state);
  res.json({ success: true, data });
});

// ISSUE #77: Price Surge/Drop Alert Simulator & Multilingual Dispatch
router.post('/alerts/simulate', handleSimulatePriceAlert);
router.get('/alerts/simulate', handleSimulatePriceAlert);
router.get('/alerts/active', (req, res) => {
  const crop = req.query.crop || 'Tomato';
  const price = parseFloat(req.query.price) || 32.0;
  const lang = req.query.lang || 'mr';
  const alert = generatePriceAlerts({ cropName: crop, currentPrice: price, lang });
  res.json({ success: true, data: alert });
});
router.get('/alerts', handleGetActivePriceAlerts);
router.post('/alerts/dispatch', authMiddleware, adminMiddleware, handleDispatchPriceAlert);

module.exports = router;


