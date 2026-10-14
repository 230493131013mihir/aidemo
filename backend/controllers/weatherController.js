/**
 * weatherController.js
 * Controller for Weather & District Rain Advisories
 * HarvestMitra AI - ISSUE-11
 */

const weatherService = require('../services/weatherService');

async function handleGetWeather(req, res) {
  try {
    const { district = 'Surat', state = 'Gujarat' } = req.query;

    if (!district || typeof district !== 'string' || district.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'District parameter is required'
      });
    }

    const data = await weatherService.getWeather({ district, state });
    return res.status(200).json(data);
  } catch (err) {
    console.error('[WeatherController Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather data'
    });
  }
}

async function handleGetRainAlerts(req, res) {
  try {
    const { district = 'Surat', state = 'Gujarat' } = req.query;

    if (!district || typeof district !== 'string' || district.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'District parameter is required'
      });
    }

    const data = await weatherService.getRainAlerts({ district, state });
    return res.status(200).json(data);
  } catch (err) {
    console.error('[WeatherController Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve weather alerts'
    });
  }
}

module.exports = {
  handleGetWeather,
  handleGetRainAlerts
};
