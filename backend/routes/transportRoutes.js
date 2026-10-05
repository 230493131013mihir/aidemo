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
  handleBookPool
} = require('../controllers/transportController');

router.get('/vehicles', handleGetVehicles);
router.post('/match', handleMatchTransport);
router.post('/pool', handleBookPool);

module.exports = router;
