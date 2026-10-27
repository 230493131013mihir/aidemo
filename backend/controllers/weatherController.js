/**
 * weatherController.js
 * Controller for Weather & District Rain Advisories
 * HarvestMitra AI - ISSUE-11
 */

const weatherService = require('../services/weatherService');

async function handleGetWeather(req, res) {
  try {
    const {
      district = req.params?.district || req.query.district || req.query.location || 'Pune',
      state = 'Maharashtra',
      location,
      lat,
      latitude,
      lon,
      lng,
      longitude
    } = { ...req.query, ...req.params };

    const resolvedDistrict = String(district || location || 'Pune').trim();
    const resolvedLatitude = latitude || lat;
    const resolvedLongitude = longitude || lon || lng;

    const data = await weatherService.getWeather({
      district: resolvedDistrict,
      state: String(state || 'Maharashtra').trim(),
      location: resolvedDistrict,
      latitude: resolvedLatitude ? Number(resolvedLatitude) : undefined,
      longitude: resolvedLongitude ? Number(resolvedLongitude) : undefined
    });
    return res.status(200).json(data);
  } catch (err) {
    console.error('[WeatherController Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather data',
      message: err.message
    });
  }
}

async function handleGetWeatherForecast(req, res) {
  try {
    const {
      location = req.query.district || 'Pune',
      district,
      state = 'Maharashtra',
      lat,
      latitude,
      lon,
      lng,
      longitude
    } = req.query;

    const resolvedLocation = String(location || district || 'Pune').trim();
    const resolvedLatitude = latitude || lat;
    const resolvedLongitude = longitude || lon || lng;

    const data = await weatherService.getWeather({
      district: resolvedLocation,
      state: String(state || 'Maharashtra').trim(),
      location: resolvedLocation,
      latitude: resolvedLatitude ? Number(resolvedLatitude) : undefined,
      longitude: resolvedLongitude ? Number(resolvedLongitude) : undefined
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('[WeatherController Forecast Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather forecast',
      message: err.message
    });
  }
}

async function handleGetRainAlerts(req, res) {
  try {
    const { district = 'Surat', state = 'Gujarat' } = req.query;

    const resolvedDistrict = String(district || 'Surat').trim();
    const data = await weatherService.getRainAlerts({
      district: resolvedDistrict,
      state: String(state || 'Gujarat').trim()
    });
    return res.status(200).json(data);
  } catch (err) {
    console.error('[WeatherController Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather alerts',
      message: err.message
    });
  }
}

module.exports = {
  handleGetWeather,
  handleGetWeatherForecast,
  handleGetRainAlerts
};

