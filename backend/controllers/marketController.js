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
    const { crop, commodity, crop_id, market, market_id, district, state, data_type } = req.query;
    const targetCrop = crop || commodity;
    const prices = await marketService.getMarketPrices({
      crop: targetCrop,
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
    const { crop = 'Tomato', market = 'Pune APMC Central Market Yard', days = 7 } = req.query;
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

const alertService = require('../services/alertService');

async function handleSyncMarketPrices(req, res) {
  try {
    const { state } = req.body || req.query || {};
    const result = await marketService.syncLiveApmcRates({ state });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[MarketController Sync Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetSyncStatus(req, res) {
  try {
    const status = await marketService.getSyncStatus();
    return res.status(200).json(status);
  } catch (err) {
    console.error('[MarketController Sync Status Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetMovingAverageTrends(req, res) {
  try {
    const { crop = 'Tomato', market = 'Pune APMC (Gultekdi)', days = 14 } = req.query;
    const trends = await marketService.getMovingAverageTrends({ crop, market, days });
    return res.status(200).json({
      success: true,
      data: trends
    });
  } catch (err) {
    console.error('[MarketController Moving Average Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleSimulatePriceAlert(req, res) {
  try {
    const params = { ...req.query, ...(req.body || {}) };
    const alertResult = await alertService.simulatePriceAlert(params);
    return res.status(200).json(alertResult);
  } catch (err) {
    console.error('[MarketController Alert Simulation Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetActivePriceAlerts(req, res) {
  try {
    const { state, thresholdPercent } = req.query;
    const alerts = await alertService.getActiveMarketAlerts({ state, thresholdPercent });
    return res.status(200).json(alerts);
  } catch (err) {
    console.error('[MarketController Active Alerts Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleDispatchPriceAlert(req, res) {
  try {
    const { alertData, channels = ['whatsapp', 'sms'] } = req.body || {};
    if (!alertData) {
      return res.status(400).json({ success: false, error: 'alertData is required to dispatch notification' });
    }
    const dispatchResult = await alertService.dispatchAlert(alertData, channels);
    return res.status(200).json(dispatchResult);
  } catch (err) {
    console.error('[MarketController Alert Dispatch Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
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
};

