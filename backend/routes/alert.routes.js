/**
 * alert.routes.js
 * Express router for WhatsApp & Mandi Alert Simulator endpoints
 * HarvestMitra AI
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  handleSendGatePassWhatsApp,
  handleSendWeatherAlert,
  handleSimulateAlert,
  handleGetActiveAlerts
} = require('../controllers/alertController');

// Deliverable: POST /api/alerts/whatsapp/send-gatepass (Secured with authMiddleware, Issue #173)
router.post('/whatsapp/send-gatepass', authMiddleware, handleSendGatePassWhatsApp);
router.get('/whatsapp/send-gatepass', handleSendGatePassWhatsApp);

// Weather Rain Advisory WhatsApp Alert Simulator (Secured with authMiddleware, Issue #173)
router.post('/whatsapp/send-weather', authMiddleware, handleSendWeatherAlert);
router.post('/whatsapp/send-rain-warning', handleSendWeatherAlert);
router.get('/whatsapp/send-weather', handleSendWeatherAlert);

// General Alert Simulator Endpoints (Secured with authMiddleware, Issue #173)
router.post('/simulate', authMiddleware, handleSimulateAlert);
router.get('/simulate', handleSimulateAlert);
router.get('/active', handleGetActiveAlerts);

module.exports = router;
