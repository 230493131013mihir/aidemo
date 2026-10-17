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

// Base Market & Crop Exploration
router.get('/', handleGetMarkets);
router.get('/crops', handleGetCrops);
router.get('/prices', handleGetMarketPrices);
router.get('/prices/trends', handleGetPriceTrends);
router.get('/compare', handleCompareMarkets);

// ISSUE #76: APMC Auto-Sync & Moving Average Trend Aggregator
router.post('/sync', handleSyncMarketPrices);
router.get('/sync', handleSyncMarketPrices);
router.get('/sync-status', handleGetSyncStatus);
router.get('/trends/moving-average', handleGetMovingAverageTrends);
router.get('/prices/moving-average', handleGetMovingAverageTrends);

// ISSUE #77: Price Surge/Drop Alert Simulator & Multilingual Dispatch
router.post('/alerts/simulate', handleSimulatePriceAlert);
router.get('/alerts/simulate', handleSimulatePriceAlert);
router.get('/alerts/active', handleGetActivePriceAlerts);
router.get('/alerts', handleGetActivePriceAlerts);
router.post('/alerts/dispatch', handleDispatchPriceAlert);

module.exports = router;

