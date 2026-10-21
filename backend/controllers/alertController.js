/**
 * alertController.js
 * Controller for WhatsApp & Multilingual Alert Dispatch Simulators
 * Connects Weather Rain Advisory (>60% rain warning) and Mandi Gate Pass
 * HarvestMitra AI
 */

const alertService = require('../services/alertService');

/**
 * POST /api/alerts/whatsapp/send-gatepass
 * Generates a WhatsApp-ready template message with QR link, pickup details,
 * and connected weather rain advisory (>60% rain warning).
 */
async function handleSendGatePassWhatsApp(req, res) {
  try {
    const params = { ...req.query, ...(req.body || {}) };

    // Validate required fields (at least farmer or pass identifier or destination)
    if (!params.farmerName && !params.gatePassCode && !params.passId && !params.bookingId && !params.cropName && !params.crop) {
      return res.status(400).json({
        success: false,
        error: 'farmerName, cropName, or gatePassCode is required to dispatch WhatsApp Gate Pass'
      });
    }

    const result = await alertService.sendGatePassWhatsAppAlert(params);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[AlertController GatePass Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/alerts/whatsapp/send-weather
 * Standalone Weather Rain Advisory WhatsApp Alert Simulator
 */
async function handleSendWeatherAlert(req, res) {
  try {
    const params = { ...req.query, ...(req.body || {}) };
    const result = await alertService.sendWeatherWhatsAppAlert(params);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[AlertController Weather Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/alerts/simulate
 * Price Surge / Drop Alert Simulator
 */
async function handleSimulateAlert(req, res) {
  try {
    const params = { ...req.query, ...(req.body || {}) };
    const result = await alertService.simulatePriceAlert(params);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[AlertController Simulate Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/alerts/active
 * Scan and return active APMC price movement alerts
 */
async function handleGetActiveAlerts(req, res) {
  try {
    const { state, thresholdPercent } = req.query;
    const result = await alertService.getActiveMarketAlerts({ state, thresholdPercent });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[AlertController Active Alerts Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleSendGatePassWhatsApp,
  handleSendWeatherAlert,
  handleSimulateAlert,
  handleGetActiveAlerts
};
