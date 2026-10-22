/**
 * alert.routes.js
 * Express router for WhatsApp & Mandi Alert Simulator endpoints
 * HarvestMitra AI
 */

const express = require('express');
const router = express.Router();
const {
  handleSendGatePassWhatsApp,
  handleSendWeatherAlert,
  handleSimulateAlert,
  handleGetActiveAlerts
} = require('../controllers/alertController');

// Deliverable: POST /api/alerts/whatsapp/send-gatepass
router.post('/whatsapp/send-gatepass', handleSendGatePassWhatsApp);
router.get('/whatsapp/send-gatepass', handleSendGatePassWhatsApp);

// Weather Rain Advisory WhatsApp Alert Simulator
router.post('/whatsapp/send-weather', handleSendWeatherAlert);
router.post('/whatsapp/send-rain-warning', handleSendWeatherAlert);
router.get('/whatsapp/send-weather', handleSendWeatherAlert);

// General Alert Simulator Endpoints
router.post('/simulate', handleSimulateAlert);
router.get('/simulate', handleSimulateAlert);
router.get('/active', handleGetActiveAlerts);

module.exports = router;
