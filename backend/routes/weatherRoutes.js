/**
 * weatherRoutes.js
 * Express router for Weather & Rain Advisory endpoints
 * HarvestMitra AI - ISSUE-11
 */

const express = require('express');
const router = express.Router();
const {
  handleGetWeather,
  handleGetWeatherForecast,
  handleGetRainAlerts
} = require('../controllers/weatherController');

router.get('/', handleGetWeather);
router.get('/forecast', handleGetWeatherForecast);
router.get('/alerts', handleGetRainAlerts);

module.exports = router;

