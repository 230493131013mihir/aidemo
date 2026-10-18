/**
 * weatherApiService.js
 * Frontend API client for Weather & District Rain Advisories
 * Supports Open-Meteo Live Agro Telemetry with resilient direct fallbacks
 * HarvestMitra AI - ISSUE-11
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';

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

  return {
    success: true,
    source: 'Open-Meteo Direct Client',
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
      isDay
    },
    rainChance,
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
 * Fetch localized weather for a district/state or coordinates
 */
export async function fetchWeather(district = 'Pune', state = 'Maharashtra', options = {}) {
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
    if (!res.ok) throw new Error(`Failed to load weather: HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    // If backend proxy failed and coordinates were provided, attempt direct Open-Meteo fallback
    if (options.latitude && options.longitude && !options.signal?.aborted) {
      try {
        return await fetchDirectOpenMeteo({
          latitude: options.latitude,
          longitude: options.longitude,
          name: district
        }, options.signal);
      } catch (_) {}
    }
    throw err;
  }
}

/**
 * Fetch weather forecast endpoint (/api/weather/forecast)
 */
export async function fetchWeatherForecast(location = 'Pune', options = {}) {
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
    if (!res.ok) throw new Error(`Failed to load weather: HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    if (options.latitude && options.longitude && !options.signal?.aborted) {
      try {
        return await fetchDirectOpenMeteo({
          latitude: options.latitude,
          longitude: options.longitude,
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
