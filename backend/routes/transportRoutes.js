/**
 * transportRoutes.js
 * Express router for Shared Transport & Logistics Pooling
 * HarvestMitra AI - ISSUE-08
 */

const express = require('express');
const router = express.Router();
const {
  handleGetVehicles,
  handleMatchTransport,
  handleBookPool,
  handleGetTelemetry,
  handleUpdateTelemetry
} = require('../controllers/transportController');

router.get('/vehicles', handleGetVehicles);
router.post('/match', handleMatchTransport);
router.post('/pool', handleBookPool);
router.get('/telemetry', handleGetTelemetry);
router.get('/telemetry/:passCode', handleGetTelemetry);
router.post('/telemetry/update', handleUpdateTelemetry);

module.exports = router;
