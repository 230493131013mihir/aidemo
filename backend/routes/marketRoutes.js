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
  handleCompareMarkets
} = require('../controllers/marketController');

router.get('/', handleGetMarkets);
router.get('/crops', handleGetCrops);
router.get('/prices', handleGetMarketPrices);
router.get('/prices/trends', handleGetPriceTrends);
router.get('/compare', handleCompareMarkets);

module.exports = router;
