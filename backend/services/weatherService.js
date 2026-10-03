/**
 * weatherService.js
 * Weather Data & District-Level Rain Advisory Service
 * HarvestMitra AI - ISSUE-11
 */

// District demo weather data (deterministic realistic profiles)
const DEMO_DISTRICT_WEATHER = {
  surat: {
    district: 'Surat',
    state: 'Gujarat',
    temperature: 29,
    humidity: 78,
    rainProbability: 70, // Exceeds default 60% threshold -> RAIN_ADVISORY
    rainfallMm: 14.5,
    windSpeedKmh: 18,
    condition: 'Rain expected',
    forecast: [
      { day: 'Today', temp: 29, rainProbability: 70, condition: 'Rain expected' },
      { day: 'Tomorrow', temp: 28, rainProbability: 65, condition: 'Scattered Showers' },
      { day: 'Day After', temp: 31, rainProbability: 30, condition: 'Partly Cloudy' }
    ]
  },
  navsari: {
    district: 'Navsari',
    state: 'Gujarat',
    temperature: 28,
    humidity: 82,
    rainProbability: 65, // Exceeds default 60% threshold -> RAIN_ADVISORY
    rainfallMm: 12.0,
    windSpeedKmh: 16,
    condition: 'Light Showers',
    forecast: [
      { day: 'Today', temp: 28, rainProbability: 65, condition: 'Light Showers' },
      { day: 'Tomorrow', temp: 27, rainProbability: 75, condition: 'Moderate Rain' },
      { day: 'Day After', temp: 30, rainProbability: 25, condition: 'Clear Sky' }
    ]
  },
  ahmedabad: {
    district: 'Ahmedabad',
    state: 'Gujarat',
    temperature: 34,
    humidity: 48,
    rainProbability: 25, // Below threshold -> CLEAR_ADVISORY
    rainfallMm: 0,
    windSpeedKmh: 12,
    condition: 'Sunny & Clear',
    forecast: [
      { day: 'Today', temp: 34, rainProbability: 25, condition: 'Sunny & Clear' },
      { day: 'Tomorrow', temp: 35, rainProbability: 20, condition: 'Clear Sky' },
      { day: 'Day After', temp: 34, rainProbability: 15, condition: 'Sunny' }
    ]
  },
  rajkot: {
    district: 'Rajkot',
    state: 'Gujarat',
    temperature: 33,
    humidity: 52,
    rainProbability: 20, // Below threshold -> CLEAR_ADVISORY
    rainfallMm: 0,
    windSpeedKmh: 14,
    condition: 'Partly Cloudy',
    forecast: [
      { day: 'Today', temp: 33, rainProbability: 20, condition: 'Partly Cloudy' },
      { day: 'Tomorrow', temp: 34, rainProbability: 20, condition: 'Clear' },
      { day: 'Day After', temp: 33, rainProbability: 10, condition: 'Sunny' }
    ]
  },
  bharuch: {
    district: 'Bharuch',
    state: 'Gujarat',
    temperature: 30,
    humidity: 72,
    rainProbability: 55, // Close to threshold
    rainfallMm: 4.0,
    windSpeedKmh: 15,
    condition: 'Overcast',
    forecast: [
      { day: 'Today', temp: 30, rainProbability: 55, condition: 'Overcast' },
      { day: 'Tomorrow', temp: 29, rainProbability: 60, condition: 'Chance of Rain' },
      { day: 'Day After', temp: 31, rainProbability: 30, condition: 'Partly Cloudy' }
    ]
  },
  nashik: {
    district: 'Nashik',
    state: 'Maharashtra',
    temperature: 26,
    humidity: 80,
    rainProbability: 75, // Exceeds default 60% threshold -> RAIN_ADVISORY
    rainfallMm: 18.0,
    windSpeedKmh: 20,
    condition: 'Thunderstorms expected',
    forecast: [
      { day: 'Today', temp: 26, rainProbability: 75, condition: 'Thunderstorms' },
      { day: 'Tomorrow', temp: 25, rainProbability: 70, condition: 'Moderate Rain' },
      { day: 'Day After', temp: 27, rainProbability: 40, condition: 'Overcast' }
    ]
  },
  pune: {
    district: 'Pune',
    state: 'Maharashtra',
    temperature: 29,
    humidity: 62,
    rainProbability: 40, // Below threshold -> CLEAR_ADVISORY
    rainfallMm: 2.0,
    windSpeedKmh: 14,
    condition: 'Passing Clouds',
    forecast: [
      { day: 'Today', temp: 29, rainProbability: 40, condition: 'Passing Clouds' },
      { day: 'Tomorrow', temp: 29, rainProbability: 35, condition: 'Partly Cloudy' },
      { day: 'Day After', temp: 30, rainProbability: 20, condition: 'Clear' }
    ]
  }
};

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || null;
    this.apiUrl = process.env.WEATHER_API_URL || null;
  }

  /**
   * Configured Rain Advisory Probability Threshold (Percentage)
   * Default: 60%
   */
  getRainThreshold() {
    const raw = process.env.RAIN_PROBABILITY_THRESHOLD;
    const parsed = Number(raw);
    return !isNaN(parsed) && parsed > 0 && parsed <= 100 ? parsed : 60;
  }

  /**
   * Determine whether live external weather provider is configured
   */
  isLiveConfigured() {
    return Boolean(this.apiKey && this.apiUrl);
  }

  /**
   * Calculate transparent, rule-based district rain advisory
   *
   * @param {number} rainProbability - Percentage 0-100
   * @param {number} [threshold] - Custom override threshold
   * @returns {Object} Structured advisory
   */
  generateRainAdvisory(rainProbability, threshold = null) {
    const activeThreshold = threshold !== null ? threshold : this.getRainThreshold();
    const prob = Number(rainProbability) || 0;

    if (prob >= activeThreshold) {
      return {
        level: 'RAIN_ADVISORY',
        isAdvisoryActive: true,
        threshold: activeThreshold,
        rainProbability: prob,
        message: 'Rain is expected in the selected district based on the available forecast. Consider checking harvest readiness and transportation plans before moving produce.',
        reason: `Rain probability (${prob}%) meets or exceeds the configured advisory threshold (${activeThreshold}%).`,
        actionableTips: [
          'Cover harvested produce with waterproof tarpaulins or move to dry shelter.',
          'Coordinate with transport partners to ensure vehicles have covered cargo beds.',
          'Review harvest timing: avoid picking perishable crops immediately before or during heavy rain.'
        ]
      };
    }

    return {
      level: 'CLEAR_ADVISORY',
      isAdvisoryActive: false,
      threshold: activeThreshold,
      rainProbability: prob,
      message: 'Low rain probability forecasted for the selected district. Favorable weather conditions for harvesting and produce transport.',
      reason: `Rain probability (${prob}%) is below the configured advisory threshold (${activeThreshold}%).`,
      actionableTips: [
        'Standard harvesting and Mandi dispatch can proceed as scheduled.',
        'Monitor temperature and sun exposure for sensitive vegetables.'
      ]
    };
  }

  /**
   * Retrieve weather information and district rain advisory for a location
   *
   * @param {Object} [params]
   * @param {string} [params.district='Surat']
   * @param {string} [params.state='Gujarat']
   * @returns {Promise<Object>}
   */
  async getWeather(params = {}) {
    const districtQuery = (params.district || 'Surat').trim();
    const stateQuery = (params.state || 'Gujarat').trim();
    const key = districtQuery.toLowerCase();

    // Check if live API is configured
    if (this.isLiveConfigured()) {
      try {
        const liveData = await this.fetchLiveWeather(districtQuery, stateQuery);
        if (liveData) return liveData;
      } catch (err) {
        console.warn(`[WeatherService] Live API call failed, falling back to demo data: ${err.message}`);
      }
    }

    // Deterministic Demo Weather Fallback
    const demo = DEMO_DISTRICT_WEATHER[key] || {
      district: districtQuery,
      state: stateQuery,
      temperature: 30,
      humidity: 65,
      rainProbability: 45,
      rainfallMm: 3.5,
      windSpeedKmh: 14,
      condition: 'Partly Cloudy',
      forecast: [
        { day: 'Today', temp: 30, rainProbability: 45, condition: 'Partly Cloudy' },
        { day: 'Tomorrow', temp: 30, rainProbability: 40, condition: 'Clear' },
        { day: 'Day After', temp: 31, rainProbability: 20, condition: 'Sunny' }
      ]
    };

    const advisory = this.generateRainAdvisory(demo.rainProbability);

    return {
      success: true,
      location: {
        district: demo.district,
        state: demo.state
      },
      weather: {
        temperature: demo.temperature,
        humidity: demo.humidity,
        rainProbability: demo.rainProbability,
        rainfallMm: demo.rainfallMm,
        windSpeedKmh: demo.windSpeedKmh,
        condition: demo.condition,
        forecast: demo.forecast
      },
      advisory,
      dataStatus: 'DEMO',
      source: 'HarvestMitra Demo Weather Dataset',
      statusNotice: 'Demo Weather Data (Live weather service is not configured. Information shown is for demonstration only.)',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Retrieve only active alerts and rain advisory for a district
   *
   * @param {Object} params
   * @param {string} [params.district='Surat']
   * @param {string} [params.state='Gujarat']
   * @returns {Promise<Object>}
   */
  async getRainAlerts(params = {}) {
    const fullWeather = await this.getWeather(params);
    return {
      success: true,
      location: fullWeather.location,
      advisory: fullWeather.advisory,
      rainProbability: fullWeather.weather.rainProbability,
      condition: fullWeather.weather.condition,
      dataStatus: fullWeather.dataStatus,
      source: fullWeather.source,
      lastUpdated: fullWeather.lastUpdated
    };
  }

  /**
   * Live External Weather Fetcher (e.g. OpenWeatherMap REST)
   * Provider-independent adapter implementation
   */
  async fetchLiveWeather(district, state) {
    const query = `${district},${state},IN`;
    const url = `${this.apiUrl}?q=${encodeURIComponent(query)}&appid=${this.apiKey}&units=metric`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Upstream provider error: HTTP ${response.status}`);
      }

      const raw = await response.json();
      const rainProb = raw.rain ? Math.min(Math.round((raw.rain['1h'] || 1) * 30), 95) : 15;
      const advisory = this.generateRainAdvisory(rainProb);

      return {
        success: true,
        location: {
          district: raw.name || district,
          state
        },
        weather: {
          temperature: Math.round(raw.main?.temp ?? 28),
          humidity: raw.main?.humidity ?? 70,
          rainProbability: rainProb,
          rainfallMm: raw.rain ? (raw.rain['1h'] || 0) : 0,
          windSpeedKmh: Math.round((raw.wind?.speed || 3) * 3.6),
          condition: raw.weather?.[0]?.description || 'Clear'
        },
        advisory,
        dataStatus: 'LIVE',
        source: 'Verified Live Weather Provider',
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }
}

const weatherService = new WeatherService();
module.exports = weatherService;
