/**
 * marketController.js
 * Controller for Mandi Market Price Endpoints
 * HarvestMitra AI - ISSUE-11
 */

const marketService = require('../services/marketService');

async function handleGetMarkets(req, res) {
  try {
    const { district, state } = req.query;
    const markets = await marketService.getAllMarkets({ district, state });
    return res.status(200).json({
      success: true,
      count: markets.length,
      data: markets
    });
  } catch (err) {
    console.error('[MarketController Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve markets' });
  }
}

async function handleGetCrops(req, res) {
  try {
    const crops = await marketService.getCrops();
    return res.status(200).json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (err) {
    console.error('[MarketController Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve crops' });
  }
}

async function handleGetMarketPrices(req, res) {
  try {
    const { crop, crop_id, market, market_id, district, state, data_type } = req.query;
    const prices = await marketService.getMarketPrices({
      crop,
      crop_id,
      market,
      market_id,
      district,
      state,
      data_type
    });

    return res.status(200).json({
      success: true,
      count: prices.length,
      data: prices
    });
  } catch (err) {
    console.error('[MarketController Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve market prices' });
  }
}

async function handleGetPriceTrends(req, res) {
  try {
    const { crop = 'Tomato', market = 'Surat APMC Mandi', days = 7 } = req.query;
    const trends = await marketService.getPriceTrends({ crop, market, days });
    return res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    console.error('[MarketController Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve price trends' });
  }
}

async function handleCompareMarkets(req, res) {
  try {
    const { crop = 'Tomato', marketIds } = req.query;
    let parsedIds = [];
    if (marketIds) {
      parsedIds = String(marketIds).split(',').map(s => s.trim()).filter(Boolean);
    }

    const comparison = await marketService.compareMarkets({ crop, marketIds: parsedIds });
    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (err) {
    console.error('[MarketController Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to compare market prices' });
  }
}

module.exports = {
  handleGetMarkets,
  handleGetCrops,
  handleGetMarketPrices,
  handleGetPriceTrends,
  handleCompareMarkets
};
