/**
 * weatherRoutes.js
 * Express router for Weather & Rain Advisory endpoints
 * HarvestMitra AI - ISSUE-11
 */

const express = require('express');
const router = express.Router();
const {
  handleGetWeather,
  handleGetRainAlerts
} = require('../controllers/weatherController');

router.get('/', handleGetWeather);
router.get('/alerts', handleGetRainAlerts);

module.exports = router;
