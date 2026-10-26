/**
 * weatherApiService.js
 * Frontend API client for Weather & District Rain Advisories
 * Supports Open-Meteo Live Agro Telemetry with resilient direct fallbacks
 * HarvestMitra AI - ISSUE-11
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) || '';

/**
 * Standard Coordinates for Supported Maharashtra Districts (ISSUE-11 / Audit Requirement)
 */
export const DISTRICT_COORDINATES = {
  pune: { latitude: 18.5204, longitude: 73.8567, name: 'Pune', state: 'Maharashtra' },
  nashik: { latitude: 19.9975, longitude: 73.7898, name: 'Nashik', state: 'Maharashtra' },
  mumbai: { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai', state: 'Maharashtra' },
  kolhapur: { latitude: 16.7050, longitude: 74.2433, name: 'Kolhapur', state: 'Maharashtra' },
  nagpur: { latitude: 21.1458, longitude: 79.0882, name: 'Nagpur', state: 'Maharashtra' },
  amravati: { latitude: 20.9374, longitude: 77.7796, name: 'Amravati', state: 'Maharashtra' },
  solapur: { latitude: 17.6599, longitude: 75.9064, name: 'Solapur', state: 'Maharashtra' },
  ahmednagar: { latitude: 19.0948, longitude: 74.7480, name: 'Ahmednagar', state: 'Maharashtra' },
  sangli: { latitude: 16.8524, longitude: 74.5815, name: 'Sangli', state: 'Maharashtra' },
  satara: { latitude: 17.6805, longitude: 74.0183, name: 'Satara', state: 'Maharashtra' }
};

export function resolveDistrictCoordinates(district) {
  if (!district) return DISTRICT_COORDINATES.pune;
  const key = String(district).trim().toLowerCase();
  return DISTRICT_COORDINATES[key] || null;
}

/**
 * WMO Weather interpretation codes (Open-Meteo official mapping)
 */
export const WMO_WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: 'sun', tone: 'amber' },
  1: { label: 'Mainly Clear', icon: 'cloud-sun', tone: 'amber' },
  2: { label: 'Partly Cloudy', icon: 'cloud-sun', tone: 'sky' },
  3: { label: 'Overcast', icon: 'cloud', tone: 'slate' },
  45: { label: 'Foggy', icon: 'cloud-fog', tone: 'slate' },
  48: { label: 'Depositing Rime Fog', icon: 'cloud-fog', tone: 'slate' },
  51: { label: 'Light Drizzle', icon: 'cloud-drizzle', tone: 'blue' },
  53: { label: 'Moderate Drizzle', icon: 'cloud-drizzle', tone: 'blue' },
  55: { label: 'Dense Drizzle', icon: 'cloud-drizzle', tone: 'blue' },
  56: { label: 'Freezing Drizzle', icon: 'cloud-snow', tone: 'cyan' },
  57: { label: 'Dense Freezing Drizzle', icon: 'cloud-snow', tone: 'cyan' },
  61: { label: 'Slight Rain', icon: 'cloud-rain', tone: 'blue' },
  63: { label: 'Moderate Rain', icon: 'cloud-rain', tone: 'blue' },
  65: { label: 'Heavy Rain', icon: 'cloud-rain', tone: 'blue' },
  66: { label: 'Freezing Rain', icon: 'cloud-rain', tone: 'cyan' },
  67: { label: 'Heavy Freezing Rain', icon: 'cloud-rain', tone: 'cyan' },
  71: { label: 'Slight Snow', icon: 'snowflake', tone: 'indigo' },
  73: { label: 'Moderate Snow', icon: 'snowflake', tone: 'indigo' },
  75: { label: 'Heavy Snow', icon: 'snowflake', tone: 'indigo' },
  77: { label: 'Snow Grains', icon: 'snowflake', tone: 'indigo' },
  80: { label: 'Slight Rain Showers', icon: 'cloud-rain', tone: 'blue' },
  81: { label: 'Moderate Showers', icon: 'cloud-rain', tone: 'blue' },
  82: { label: 'Violent Rain Showers', icon: 'cloud-rain', tone: 'indigo' },
  85: { label: 'Slight Snow Showers', icon: 'snowflake', tone: 'indigo' },
  86: { label: 'Heavy Snow Showers', icon: 'snowflake', tone: 'indigo' },
  95: { label: 'Thunderstorm', icon: 'cloud-lightning', tone: 'amber' },
  96: { label: 'Thunderstorm with Slight Hail', icon: 'cloud-lightning', tone: 'red' },
  99: { label: 'Thunderstorm with Heavy Hail', icon: 'cloud-lightning', tone: 'red' }
};

export function getWeatherConditionMeta(code, isDay = true) {
  const meta = WMO_WEATHER_CODES[Number(code)] || { label: 'Clear Sky', icon: isDay ? 'sun' : 'moon', tone: 'amber' };
  return {
    ...meta,
    icon: (code === 0 && !isDay) ? 'moon' : meta.icon
  };
}

/**
 * Direct Open-Meteo Client Call (Fall-through resilience if backend proxy is offline)
 */
export async function fetchDirectOpenMeteo({ latitude, longitude, name = 'Current Location' }, signal = null) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,wind_speed_10m&daily=precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Direct Open-Meteo HTTP ${res.status}`);
  const data = await res.json();
  const cur = data.current || {};
  const code = cur.weather_code ?? 0;
  const isDay = cur.is_day !== undefined ? Boolean(cur.is_day) : true;
  const meta = getWeatherConditionMeta(code, isDay);
  const rainChance = Number(data.daily?.precipitation_probability_max?.[0] || 0);

  const isAdvisoryActive = rainChance >= 60;
  const advisory = {
    level: isAdvisoryActive ? 'RAIN_ADVISORY' : 'CLEAR_ADVISORY',
    isAdvisoryActive,
    threshold: 60,
    rainProbability: rainChance,
    message: isAdvisoryActive
      ? 'Elevated rain probability forecasted for the selected district. Farmers are advised to postpone open-air harvesting or arrange waterproof storage.'
      : 'Low rain probability forecasted for the selected district. Favorable weather conditions for harvesting and produce transport.',
    reason: `Rain probability (${rainChance}%) is ${isAdvisoryActive ? 'at or above' : 'below'} the advisory threshold (60%).`,
    actionableTips: isAdvisoryActive ? [
      'Cover harvested crops with waterproof tarpaulins immediately.',
      'Check district APMC covered shed availability before transport dispatch.',
      'Delay perishable crop harvesting if transit cannot be arranged in covered trucks.'
    ] : [
      'Standard harvesting and Mandi dispatch can proceed as scheduled.',
      'Monitor temperature and sun exposure for sensitive vegetables.'
    ]
  };

  const daily = data.daily || {};
  const forecastDays = ['Today', 'Tomorrow', 'Day After'];
  const forecast = (daily.time || []).slice(0, 3).map((date, idx) => {
    const pProb = Number(daily.precipitation_probability_max?.[idx] ?? rainChance);
    const maxT = Math.round(Number(daily.temperature_2m_max?.[idx] ?? cur.temperature_2m ?? 28));
    return {
      day: forecastDays[idx] || date,
      temp: maxT,
      rainProbability: pProb,
      condition: pProb >= 60 ? 'Rain expected' : pProb >= 30 ? 'Scattered Showers' : 'Clear Sky'
    };
  });

  return {
    success: true,
    source: 'Open-Meteo Live Agro Telemetry',
    dataStatus: 'LIVE',
    location: {
      name,
      district: name,
      latitude,
      longitude
    },
    current: {
      temperature: Math.round(Number(cur.temperature_2m ?? 28)),
      feelsLike: Math.round(Number(cur.apparent_temperature ?? cur.temperature_2m ?? 28)),
      humidity: Math.round(Number(cur.relative_humidity_2m ?? 50)),
      precipitation: Number((cur.precipitation ?? cur.rain ?? 0).toFixed(1)),
      rainfallMm: Number((cur.precipitation ?? cur.rain ?? 0).toFixed(1)),
      windSpeed: Math.round(Number(cur.wind_speed_10m ?? 10)),
      windSpeedKmh: Math.round(Number(cur.wind_speed_10m ?? 10)),
      condition: meta.label,
      weatherCode: code,
      isDay
    },
    weather: {
      temperature: Math.round(Number(cur.temperature_2m ?? 28)),
      feelsLike: Math.round(Number(cur.apparent_temperature ?? cur.temperature_2m ?? 28)),
      humidity: Math.round(Number(cur.relative_humidity_2m ?? 50)),
      rainProbability: rainChance,
      rainfallMm: Number((cur.precipitation ?? cur.rain ?? 0).toFixed(1)),
      windSpeedKmh: Math.round(Number(cur.wind_speed_10m ?? 10)),
      condition: meta.label,
      weatherCode: code,
      isDay,
      forecast: forecast.length > 0 ? forecast : [
        { day: 'Today', temp: Math.round(Number(cur.temperature_2m ?? 28)), rainProbability: rainChance, condition: meta.label },
        { day: 'Tomorrow', temp: Math.round(Number(cur.temperature_2m ?? 28)), rainProbability: Math.max(0, rainChance - 5), condition: 'Partly Cloudy' },
        { day: 'Day After', temp: Math.round(Number(cur.temperature_2m ?? 29)), rainProbability: Math.max(0, rainChance - 10), condition: 'Clear Sky' }
      ]
    },
    rainChance,
    advisory,
    advice: {
      status: rainChance >= 60 ? 'Delay harvest' : 'Safe for harvesting',
      detail: rainChance >= 60
        ? 'High rain probability detected. Store harvested produce in covered shelter.'
        : 'Favorable atmospheric conditions for produce picking and Mandi dispatch.'
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Enriches weather payload with WhatsApp Heavy Rain Alert preview when rain >= 60%
 */
export function enrichWithWhatsAppRainAlert(data, district = 'Your District') {
  if (!data) return data;
  const rainProb = data.rainChance ?? data.weather?.rainProbability ?? data.current?.rainProbability ?? 0;
  if (rainProb >= 60) {
    const loc = data.location?.name || district || 'Your District';
    if (!data.whatsappAlertPreview) {
      data.whatsappAlertPreview = {
        title: `🌧️ Heavy Rain Warning WhatsApp Alert (${rainProb}%)`,
        district: loc,
        rainProbability: rainProb,
        threshold: 60,
        isHeavyRain: true,
        channel: 'WhatsApp Cloud API',
        message: `⚠️ *HarvestMitra Heavy Rain Warning: ${loc}*\nRain probability is ${rainProb}% (>60% threshold).\nDelay harvest or move produce to dry shelter!\nAction: Cover cargo with waterproof tarpaulins.\nDetails: https://harvestmitra.in/weather?district=${encodeURIComponent(loc)}`,
        whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`⚠️ *HarvestMitra Rain Advisory: ${loc}*\nRain probability is ${rainProb}% (>60%). Delay harvest and secure covered storage! https://harvestmitra.in/weather?district=${encodeURIComponent(loc)}`)}`
      };
    }
    // Dispatch instant custom event if in browser
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('harvestmitra:weather-whatsapp-alert', { detail: data.whatsappAlertPreview }));
      } catch (_) {}
    }
  }
  return data;
}

/**
 * Helper to trigger an instant WhatsApp preview toast when heavy rain (>60%) is detected
 */
export function triggerWhatsAppRainToast(weatherData, showToast) {
  if (!weatherData || !showToast) return;
  const rainProb = weatherData.rainChance ?? weatherData.weather?.rainProbability ?? weatherData.current?.rainProbability ?? 0;
  if (rainProb >= 60) {
    const loc = weatherData.location?.name || 'Your District';
    showToast({
      type: 'whatsapp',
      title: `🌧️ Heavy Rain Alert: ${loc} (${rainProb}%)`,
      message: `Rain probability is ${rainProb}% (>60%). WhatsApp rain advisory dispatched: Delay harvest and cover cargo with tarpaulins.`,
      duration: 7000,
      whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`⚠️ *HarvestMitra Heavy Rain Alert: ${loc}*\nRain probability: ${rainProb}% (>60% warning). Delay harvest or move produce to dry shelter! https://harvestmitra.in/weather?district=${encodeURIComponent(loc)}`)}`
    });
  }
}

/**
 * Fetch localized weather for a district/state or coordinates
 */
export async function fetchWeather(district = 'Pune', state = 'Maharashtra', options = {}) {
  const coords = (options.latitude && options.longitude)
    ? { latitude: options.latitude, longitude: options.longitude }
    : resolveDistrictCoordinates(district);

  const params = { district, state };
  if (options.latitude && options.longitude) {
    params.latitude = options.latitude;
    params.longitude = options.longitude;
  }
  if (options.location) {
    params.location = options.location;
  }
  if (options.forceRefresh) {
    params._t = Date.now();
  }

  const query = new URLSearchParams(params);
  const url = `${API_BASE_URL}/api/weather?${query.toString()}`;

  try {
    const res = await fetch(url, { signal: options.signal });
    if (!res.ok) {
      if (res.status === 404 && coords && !options.signal?.aborted) {
        try {
          const direct = await fetchDirectOpenMeteo({
            latitude: coords.latitude,
            longitude: coords.longitude,
            name: district
          }, options.signal);
          return enrichWithWhatsAppRainAlert(direct, district);
        } catch (_) {}
      }
      throw new Error(`Failed to load weather: HTTP ${res.status}`);
    }
    const data = await res.json();

    // When GPS coordinates are supplied, ensure real Open-Meteo live telemetry is used (0% on clear days, Issue #176)
    if (options.latitude && options.longitude && (data.dataStatus === 'DEMO' || data.source?.includes('Demo'))) {
      try {
        const direct = await fetchDirectOpenMeteo({
          latitude: options.latitude,
          longitude: options.longitude,
          name: district
        }, options.signal);
        if (direct && direct.success) {
          return enrichWithWhatsAppRainAlert(direct, district);
        }
      } catch (_) {}
    }

    return enrichWithWhatsAppRainAlert(data, district);
  } catch (err) {
    // If backend proxy failed (404, network error) and coordinates were provided or resolved, attempt direct Open-Meteo fallback
    if (coords && (err.message?.includes('HTTP 404') || err.name === 'TypeError' || !err.message?.includes('HTTP')) && !options.signal?.aborted) {
      try {
        const direct = await fetchDirectOpenMeteo({
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: district
        }, options.signal);
        return enrichWithWhatsAppRainAlert(direct, district);
      } catch (_) {}
    }
    throw err;
  }
}

/**
 * Fetch weather forecast endpoint (/api/weather/forecast)
 */
export async function fetchWeatherForecast(location = 'Pune', options = {}) {
  const coords = (options.latitude && options.longitude)
    ? { latitude: options.latitude, longitude: options.longitude }
    : resolveDistrictCoordinates(location);

  const params = { location };
  if (options.latitude && options.longitude) {
    params.latitude = options.latitude;
    params.longitude = options.longitude;
  }
  if (options.forceRefresh) {
    params._t = Date.now();
  }

  const query = new URLSearchParams(params);
  const url = `${API_BASE_URL}/api/weather/forecast?${query.toString()}`;

  try {
    const res = await fetch(url, { signal: options.signal });
    if (!res.ok) {
      if (res.status === 404 && coords && !options.signal?.aborted) {
        try {
          return await fetchDirectOpenMeteo({
            latitude: coords.latitude,
            longitude: coords.longitude,
            name: location
          }, options.signal);
        } catch (_) {}
      }
      throw new Error(`Failed to load weather: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    if (coords && (err.message?.includes('HTTP 404') || err.name === 'TypeError' || !err.message?.includes('HTTP')) && !options.signal?.aborted) {
      try {
        return await fetchDirectOpenMeteo({
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: location
        }, options.signal);
      } catch (_) {}
    }
    throw err;
  }
}

export async function fetchRainAlerts(district = 'Pune', state = 'Maharashtra') {
  const query = new URLSearchParams({ district, state });
  const url = `${API_BASE_URL}/api/weather/alerts?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load rain alerts: HTTP ${res.status}`);
  return await res.json();
}
