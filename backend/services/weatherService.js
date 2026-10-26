const DEMO_LOCATIONS = {
    pune: { name: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
    surat: { name: "Surat", state: "Gujarat", latitude: 21.1702, longitude: 72.8311 },
    ahmedabad: { name: "Ahmedabad", state: "Gujarat", latitude: 23.0225, longitude: 72.5714 },
    rajkot: { name: "Rajkot", state: "Gujarat", latitude: 22.3039, longitude: 70.8022 },
    nashik: { name: "Nashik", state: "Maharashtra", latitude: 19.9975, longitude: 73.7898 },
    delhi: { name: "Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209 },
    mumbai: { name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
    kolhapur: { name: "Kolhapur", state: "Maharashtra", latitude: 16.7050, longitude: 74.2433 },
    solapur: { name: "Solapur", state: "Maharashtra", latitude: 17.6599, longitude: 75.9064 },
    ahmednagar: { name: "Ahmednagar", state: "Maharashtra", latitude: 19.0948, longitude: 74.7480 },
    nagpur: { name: "Nagpur", state: "Maharashtra", latitude: 21.1458, longitude: 79.0882 },
    amravati: { name: "Amravati", state: "Maharashtra", latitude: 20.9374, longitude: 77.7796 },
    sangli: { name: "Sangli", state: "Maharashtra", latitude: 16.8524, longitude: 74.5815 },
    satara: { name: "Satara", state: "Maharashtra", latitude: 17.6805, longitude: 74.0183 }
};

function getWeatherCodeLabel(code) {
    if ([0].includes(code)) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain expected";
    if ([95, 96, 99].includes(code)) return "Thunderstorm risk";
    return "Weather update";
}

function getHarvestAdvice({ rainChance, precipitation, windSpeed }) {
    if (rainChance >= 60 || precipitation >= 5) {
        return {
            status: "Delay harvest",
            tone: "danger",
            detail: "High rain risk can damage harvested crop. Prefer waiting or arranging covered storage."
        };
    }
    if (rainChance >= 30 || precipitation >= 1 || windSpeed >= 28) {
        return {
            status: "Harvest with caution",
            tone: "warning",
            detail: "Moderate weather risk. Harvest only if transport and storage are ready."
        };
    }
    return {
        status: "Safe for harvesting",
        tone: "success",
        detail: "Low rain risk. Good window for harvesting and transport planning."
    };
}

function getDemoLocation(location) {
    const key = String(location || "pune").trim().toLowerCase();
    return DEMO_LOCATIONS[key] || {
        name: location || "Pune",
        state: "India",
        latitude: 18.5204,
        longitude: 73.8567
    };
}

async function geocodeLocation(location) {
    const fallback = getDemoLocation(location);
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", location || fallback.name);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`geocoding failed with ${response.status}`);
        const payload = await response.json();
        const first = payload.results?.[0];
        if (!first) return fallback;
        return {
            name: first.name,
            state: first.admin1 || first.country || "India",
            latitude: first.latitude,
            longitude: first.longitude
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchOpenMeteoForecast(location, coords = null) {
    let place;
    if (coords && coords.latitude && coords.longitude) {
        place = {
            name: coords.name || location || "Current Location",
            state: coords.state || "India",
            latitude: Number(coords.latitude),
            longitude: Number(coords.longitude)
        };
    } else {
        place = await geocodeLocation(location);
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(place.latitude));
    url.searchParams.set("longitude", String(place.longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,wind_speed_10m");
    url.searchParams.set("daily", "precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("forecast_days", "5");
    url.searchParams.set("timezone", "auto");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Open-Meteo failed with ${response.status}`);
        const payload = await response.json();
        const current = payload.current || {};
        const rainChance = Number(payload.daily?.precipitation_probability_max?.[0] || 0);
        const precipitation = Number((current.precipitation ?? current.rain ?? 0).toFixed(1));
        const windSpeed = Number(current.wind_speed_10m || 0);
        const advice = getHarvestAdvice({ rainChance, precipitation, windSpeed });

        return {
            success: true,
            source: "Open-Meteo Live Agro Telemetry",
            dataStatus: "LIVE",
            message: "Live weather loaded from Open-Meteo.",
            location: place,
            current: {
                temperature: Number(current.temperature_2m ?? 0),
                feelsLike: Number(current.apparent_temperature ?? current.temperature_2m ?? 0),
                humidity: Number(current.relative_humidity_2m ?? 0),
                precipitation,
                windSpeed,
                weatherCode: current.weather_code,
                isDay: current.is_day !== undefined ? Boolean(current.is_day) : true,
                condition: getWeatherCodeLabel(current.weather_code)
            },
            rainChance,
            advice,
            daily: (payload.daily?.time || []).map((date, index) => ({
                date,
                rainChance: Number(payload.daily.precipitation_probability_max?.[index] || 0),
                precipitation: Number(payload.daily.precipitation_sum?.[index] || 0),
                maxTemp: Number(payload.daily.temperature_2m_max?.[index] || 0),
                minTemp: Number(payload.daily.temperature_2m_min?.[index] || 0)
            })),
            lastUpdated: new Date().toISOString()
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function getWeatherForecast(query = {}) {
    const location = query.location || query.district || "Pune";
    const coords = (query.latitude && query.longitude) ? {
        latitude: query.latitude,
        longitude: query.longitude,
        name: location,
        state: query.state || "India"
    } : (query.lat && query.lon) ? {
        latitude: query.lat,
        longitude: query.lon,
        name: location,
        state: query.state || "India"
    } : null;

    try {
        return await fetchOpenMeteoForecast(location, coords);
    } catch (error) {
        console.warn("Live weather fetch failed:", error.message);
        const err = new Error("Live weather is unavailable right now. Check internet/Open-Meteo access and try again.");
        err.statusCode = 503;
        throw err;
    }
}
/**
 * weatherService.js
 * Weather Data & District-Level Rain Advisory Service
 * HarvestMitra AI - ISSUE-11
 */

// District demo weather data (deterministic realistic profiles)
const DEMO_DISTRICT_WEATHER = {
  surat: {
    district: 'Surat',
    state: 'Maharashtra',
    temperature: 29,
    humidity: 78,
    rainProbability: 65, // Exceeds default 60% threshold -> RAIN_ADVISORY
    rainfallMm: 14.5,
    windSpeedKmh: 18,
    condition: 'Rain expected',
    forecast: [
      { day: 'Today', temp: 29, rainProbability: 65, condition: 'Rain expected' },
      { day: 'Tomorrow', temp: 28, rainProbability: 65, condition: 'Scattered Showers' },
      { day: 'Day After', temp: 31, rainProbability: 30, condition: 'Partly Cloudy' }
    ]
  },
  navsari: {
    district: 'Navsari',
    state: 'Maharashtra',
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
    state: 'Maharashtra',
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
    state: 'Maharashtra',
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
    state: 'Maharashtra',
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
  },
  mumbai: {
    district: 'Mumbai',
    state: 'Maharashtra',
    temperature: 31,
    humidity: 75,
    rainProbability: 35,
    rainfallMm: 1.0,
    windSpeedKmh: 16,
    condition: 'Partly Cloudy',
    forecast: [
      { day: 'Today', temp: 31, rainProbability: 35, condition: 'Partly Cloudy' },
      { day: 'Tomorrow', temp: 31, rainProbability: 30, condition: 'Clear Sky' },
      { day: 'Day After', temp: 32, rainProbability: 25, condition: 'Sunny' }
    ]
  },
  kolhapur: {
    district: 'Kolhapur',
    state: 'Maharashtra',
    temperature: 28,
    humidity: 70,
    rainProbability: 45,
    rainfallMm: 3.0,
    windSpeedKmh: 12,
    condition: 'Scattered Clouds',
    forecast: [
      { day: 'Today', temp: 28, rainProbability: 45, condition: 'Scattered Clouds' },
      { day: 'Tomorrow', temp: 28, rainProbability: 40, condition: 'Partly Cloudy' },
      { day: 'Day After', temp: 29, rainProbability: 30, condition: 'Clear' }
    ]
  },
  nagpur: {
    district: 'Nagpur',
    state: 'Maharashtra',
    temperature: 33,
    humidity: 50,
    rainProbability: 20,
    rainfallMm: 0,
    windSpeedKmh: 10,
    condition: 'Clear Sky',
    forecast: [
      { day: 'Today', temp: 33, rainProbability: 20, condition: 'Clear Sky' },
      { day: 'Tomorrow', temp: 34, rainProbability: 20, condition: 'Sunny' },
      { day: 'Day After', temp: 34, rainProbability: 15, condition: 'Sunny' }
    ]
  },
  amravati: {
    district: 'Amravati',
    state: 'Maharashtra',
    temperature: 32,
    humidity: 52,
    rainProbability: 25,
    rainfallMm: 0,
    windSpeedKmh: 11,
    condition: 'Clear Sky',
    forecast: [
      { day: 'Today', temp: 32, rainProbability: 25, condition: 'Clear Sky' },
      { day: 'Tomorrow', temp: 33, rainProbability: 20, condition: 'Sunny' },
      { day: 'Day After', temp: 33, rainProbability: 20, condition: 'Clear' }
    ]
  },
  solapur: {
    district: 'Solapur',
    state: 'Maharashtra',
    temperature: 34,
    humidity: 45,
    rainProbability: 15,
    rainfallMm: 0,
    windSpeedKmh: 13,
    condition: 'Sunny',
    forecast: [
      { day: 'Today', temp: 34, rainProbability: 15, condition: 'Sunny' },
      { day: 'Tomorrow', temp: 35, rainProbability: 15, condition: 'Clear Sky' },
      { day: 'Day After', temp: 35, rainProbability: 10, condition: 'Sunny' }
    ]
  },
  ahmednagar: {
    district: 'Ahmednagar',
    state: 'Maharashtra',
    temperature: 30,
    humidity: 58,
    rainProbability: 30,
    rainfallMm: 0.5,
    windSpeedKmh: 12,
    condition: 'Partly Cloudy',
    forecast: [
      { day: 'Today', temp: 30, rainProbability: 30, condition: 'Partly Cloudy' },
      { day: 'Tomorrow', temp: 30, rainProbability: 25, condition: 'Clear' },
      { day: 'Day After', temp: 31, rainProbability: 20, condition: 'Sunny' }
    ]
  },
  sangli: {
    district: 'Sangli',
    state: 'Maharashtra',
    temperature: 29,
    humidity: 65,
    rainProbability: 35,
    rainfallMm: 1.5,
    windSpeedKmh: 12,
    condition: 'Passing Clouds',
    forecast: [
      { day: 'Today', temp: 29, rainProbability: 35, condition: 'Passing Clouds' },
      { day: 'Tomorrow', temp: 29, rainProbability: 30, condition: 'Partly Cloudy' },
      { day: 'Day After', temp: 30, rainProbability: 20, condition: 'Clear' }
    ]
  },
  satara: {
    district: 'Satara',
    state: 'Maharashtra',
    temperature: 27,
    humidity: 68,
    rainProbability: 40,
    rainfallMm: 2.0,
    windSpeedKmh: 14,
    condition: 'Partly Cloudy',
    forecast: [
      { day: 'Today', temp: 27, rainProbability: 40, condition: 'Partly Cloudy' },
      { day: 'Tomorrow', temp: 27, rainProbability: 35, condition: 'Passing Clouds' },
      { day: 'Day After', temp: 28, rainProbability: 25, condition: 'Clear' }
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
        ],
        whatsappPreview: {
          title: '🌧️ Heavy Rain Warning WhatsApp Alert (>60%)',
          channel: 'WhatsApp Cloud API',
          message: `⚠️ *HarvestMitra Heavy Rain Warning*\nRain probability is ${prob}% (exceeds ${activeThreshold}% threshold).\nDelay harvest or move produce to dry shelter!\nAction: Cover cargo with waterproof tarpaulins.\nDetails: https://harvestmitra.in/weather`,
          isHeavyRain: true,
          rainProbability: prob,
          threshold: activeThreshold
        }
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
   * @param {string} [params.district='Pune']
   * @param {string} [params.state='Maharashtra']
   * @param {string} [params.location]
   * @param {number} [params.latitude]
   * @param {number} [params.longitude]
   * @returns {Promise<Object>}
   */
  async getWeather(params = {}) {
    const districtQuery = (params.district || params.location || params.city || 'Pune').trim();
    const stateQuery = (params.state || 'Maharashtra').trim();
    const key = districtQuery.toLowerCase();

    const coords = (params.latitude && params.longitude) ? {
      latitude: Number(params.latitude),
      longitude: Number(params.longitude),
      name: districtQuery,
      state: stateQuery
    } : (params.lat && params.lon) ? {
      latitude: Number(params.lat),
      longitude: Number(params.lon),
      name: districtQuery,
      state: stateQuery
    } : null;

    // 1. Live real-time agro weather telemetry via Open-Meteo (bypassed in test environment)
    if (process.env.NODE_ENV !== 'test') {
      try {
        const openMeteo = await fetchOpenMeteoForecast(`${districtQuery}, ${stateQuery}`, coords);
        if (openMeteo && openMeteo.current) {
          const cur = openMeteo.current;
          const rainProb = openMeteo.rainChance || 0;
          const advisory = this.generateRainAdvisory(rainProb);

          const forecast = (openMeteo.daily || []).slice(0, 3).map((d, idx) => {
            const dayLabels = ['Today', 'Tomorrow', 'Day After'];
            return {
              day: dayLabels[idx] || d.date,
              temp: Math.round(d.maxTemp || cur.temperature),
              rainProbability: d.rainChance || 0,
              condition: d.rainChance >= 60 ? 'Rain expected' : d.rainChance >= 30 ? 'Scattered Showers' : 'Clear Sky'
            };
          });

          const weatherObj = {
            temperature: Math.round(cur.temperature),
            feelsLike: Math.round(cur.feelsLike ?? cur.temperature),
            humidity: Math.round(cur.humidity),
            rainProbability: rainProb,
            rainfallMm: Number((cur.precipitation || 0).toFixed(1)),
            windSpeedKmh: Math.round(cur.windSpeed || 14),
            condition: cur.condition || 'Clear Sky',
            weatherCode: cur.weatherCode,
            isDay: cur.isDay,
            forecast: forecast.length > 0 ? forecast : [
              { day: 'Today', temp: Math.round(cur.temperature), rainProbability: rainProb, condition: cur.condition },
              { day: 'Tomorrow', temp: Math.round(cur.temperature), rainProbability: Math.max(0, rainProb - 5), condition: 'Partly Cloudy' },
              { day: 'Day After', temp: Math.round(cur.temperature + 1), rainProbability: Math.max(0, rainProb - 10), condition: 'Sunny & Clear' }
            ]
          };

          return {
            success: true,
            location: {
              district: districtQuery,
              state: stateQuery,
              name: openMeteo.location?.name || districtQuery,
              latitude: openMeteo.location?.latitude,
              longitude: openMeteo.location?.longitude
            },
            weather: weatherObj,
            current: {
              temperature: Math.round(cur.temperature),
              feelsLike: Math.round(cur.feelsLike ?? cur.temperature),
              humidity: Math.round(cur.humidity),
              rainProbability: rainProb,
              rainChance: rainProb,
              rainfallMm: Number((cur.precipitation || 0).toFixed(1)),
              precipitation: Number((cur.precipitation || 0).toFixed(1)),
              windSpeed: Math.round(cur.windSpeed || 14),
              windSpeedKmh: Math.round(cur.windSpeed || 14),
              condition: cur.condition || 'Clear Sky',
              weatherCode: cur.weatherCode,
              isDay: cur.isDay
            },
            rainChance: rainProb,
            advice: openMeteo.advice,
            advisory,
            whatsappAlertPreview: rainProb >= 60 ? {
              channel: 'WhatsApp Cloud API',
              title: `🌧️ Heavy Rain Warning WhatsApp Alert (${rainProb}%)`,
              recipient: params.farmerPhone || params.phone || '+91 98765 43210',
              district: districtQuery,
              rainProbability: rainProb,
              threshold: 60,
              isHeavyRain: true,
              message: `⚠️ *HarvestMitra Heavy Rain Warning: ${districtQuery}*\nRain probability is ${rainProb}% (>60% threshold).\nDelay harvest or move produce to dry shelter!\nAction: Cover cargo with waterproof tarpaulins.\nDetails: https://harvestmitra.in/weather?district=${encodeURIComponent(districtQuery)}`
            } : null,
            dataStatus: 'LIVE',
            source: 'Open-Meteo Live Agro Telemetry',
            statusNotice: 'Verified Live Open-Meteo Agro Weather Feed',
            lastUpdated: openMeteo.lastUpdated || new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn(`[WeatherService] Open-Meteo live call failed, falling back to cached profiles: ${err.message}`);
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

    const demoWeather = {
      temperature: demo.temperature,
      feelsLike: demo.temperature,
      humidity: demo.humidity,
      rainProbability: demo.rainProbability,
      rainfallMm: demo.rainfallMm,
      windSpeedKmh: demo.windSpeedKmh,
      condition: demo.condition,
      weatherCode: 2,
      isDay: true,
      forecast: demo.forecast
    };

    return {
      success: true,
      location: {
        district: demo.district,
        state: demo.state,
        name: demo.district
      },
      weather: demoWeather,
      current: {
        temperature: demo.temperature,
        feelsLike: demo.temperature,
        humidity: demo.humidity,
        rainProbability: demo.rainProbability,
        rainChance: demo.rainProbability,
        rainfallMm: demo.rainfallMm,
        precipitation: demo.rainfallMm,
        windSpeed: demo.windSpeedKmh,
        windSpeedKmh: demo.windSpeedKmh,
        condition: demo.condition,
        weatherCode: 2,
        isDay: true
      },
      rainChance: demo.rainProbability,
      advice: {
        status: demo.rainProbability >= 60 ? 'Delay harvest' : 'Safe for harvesting',
        detail: `Favorable atmospheric conditions in ${demo.district} agro-climatic zone.`
      },
      advisory,
      whatsappAlertPreview: demo.rainProbability >= 60 ? {
        channel: 'WhatsApp Cloud API',
        title: `🌧️ Heavy Rain Warning WhatsApp Alert (${demo.rainProbability}%)`,
        recipient: params.farmerPhone || params.phone || '+91 98765 43210',
        district: demo.district,
        rainProbability: demo.rainProbability,
        threshold: 60,
        isHeavyRain: true,
        message: `⚠️ *HarvestMitra Heavy Rain Warning: ${demo.district}*\nRain probability is ${demo.rainProbability}% (>60% threshold).\nDelay harvest or move produce to dry shelter!\nAction: Cover cargo with waterproof tarpaulins.\nDetails: https://harvestmitra.in/weather?district=${encodeURIComponent(demo.district)}`
      } : null,
      dataStatus: 'DEMO',
      source: 'HarvestMitra Demo Weather Dataset',
      statusNotice: 'Demo Weather Data (Live weather service fallback)',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Retrieve only active alerts and rain advisory for a district
   *
   * @param {Object} params
   * @param {string} [params.district='Pune']
   * @param {string} [params.state='Maharashtra']
   * @returns {Promise<Object>}
   */
  async getRainAlerts(params = {}) {
    const fullWeather = await this.getWeather(params);
    return {
      success: true,
      location: fullWeather.location,
      advisory: fullWeather.advisory,
      whatsappAlertPreview: fullWeather.whatsappAlertPreview || null,
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
weatherService.getWeatherForecast = getWeatherForecast;

module.exports = weatherService;
module.exports.getWeatherForecast = getWeatherForecast;

