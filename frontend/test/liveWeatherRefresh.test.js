/**
 * liveWeatherRefresh.test.js
 * Verification of Live Weather API Integration and Refresh Engine
 * HarvestMitra AI - Farmer Dashboard Weather Suite
 */

import assert from 'node:assert';
import {
  WMO_WEATHER_CODES,
  getWeatherConditionMeta,
  fetchWeather,
  fetchWeatherForecast,
  fetchDirectOpenMeteo
} from '../src/services/weatherApiService.js';

console.log('\n======================================================');
console.log('🌦️ HarvestMitra AI — Live Weather & Refresh Engine Tests');
console.log('======================================================\n');

// 1. Verify WMO Weather Code Mappings
console.log('1. Auditing Official WMO Weather Code Mappings:');
assert.strictEqual(getWeatherConditionMeta(0, true).label, 'Clear Sky');
assert.strictEqual(getWeatherConditionMeta(0, true).icon, 'sun');
assert.strictEqual(getWeatherConditionMeta(0, false).icon, 'moon');
assert.strictEqual(getWeatherConditionMeta(2, true).label, 'Partly Cloudy');
assert.strictEqual(getWeatherConditionMeta(61, true).label, 'Slight Rain');
assert.strictEqual(getWeatherConditionMeta(95, true).label, 'Thunderstorm');
console.log('  ✅ [PASS] WMO Weather Codes (0, 2, 61, 95) accurately mapped to descriptions and dynamic day/night icons.');

// 2. Verify fetchWeather Client Contract with Force Refresh Cache-Buster
console.log('\n2. Auditing fetchWeather Contract & Manual Refresh Cache-Buster:');
const originalFetch = global.fetch;

try {
  let capturedUrl = '';
  global.fetch = async (url) => {
    capturedUrl = url;
    return {
      ok: true,
      json: async () => ({
        success: true,
        source: 'Open-Meteo Live Agro Telemetry',
        dataStatus: 'LIVE',
        location: { district: 'Pune', state: 'Maharashtra', name: 'Pune' },
        current: {
          temperature: 30,
          feelsLike: 31,
          humidity: 45,
          precipitation: 0.0,
          windSpeed: 12,
          condition: 'Clear Sky',
          weatherCode: 0,
          isDay: true
        },
        weather: {
          temperature: 30,
          feelsLike: 31,
          humidity: 45,
          rainProbability: 5,
          rainfallMm: 0.0,
          windSpeedKmh: 12,
          condition: 'Clear Sky',
          weatherCode: 0,
          isDay: true
        },
        rainChance: 5,
        advice: { status: 'Optimal Harvest Window', detail: 'Favorable conditions' },
        lastUpdated: new Date().toISOString()
      })
    };
  };

  const weatherRes = await fetchWeather('Pune', 'Maharashtra', { forceRefresh: true });
  assert.ok(capturedUrl.includes('/api/weather?'));
  assert.ok(capturedUrl.includes('district=Pune'));
  assert.ok(capturedUrl.includes('state=Maharashtra'));
  assert.ok(capturedUrl.includes('_t='), 'Must include timestamp cache-buster on manual refresh');
  assert.strictEqual(weatherRes.current.temperature, 30);
  assert.strictEqual(weatherRes.current.feelsLike, 31);
  assert.strictEqual(weatherRes.current.humidity, 45);
  assert.strictEqual(weatherRes.current.windSpeed, 12);
  assert.strictEqual(weatherRes.current.weatherCode, 0);
  console.log('  ✅ [PASS] fetchWeather includes cache-buster _t and returns complete current & feelsLike telemetry.');

  // 3. Verify fetchWeatherForecast Contract (/api/weather/forecast)
  console.log('\n3. Auditing fetchWeatherForecast Endpoint (/api/weather/forecast):');
  let forecastUrl = '';
  global.fetch = async (url) => {
    forecastUrl = url;
    return {
      ok: true,
      json: async () => ({
        success: true,
        location: { name: 'Nashik' },
        current: { temperature: 28, condition: 'Partly cloudy' }
      })
    };
  };

  const forecastRes = await fetchWeatherForecast('Nashik', { forceRefresh: true });
  assert.ok(forecastUrl.includes('/api/weather/forecast?'));
  assert.ok(forecastUrl.includes('location=Nashik'));
  assert.ok(forecastUrl.includes('_t='));
  assert.strictEqual(forecastRes.current.temperature, 28);
  console.log('  ✅ [PASS] fetchWeatherForecast correctly queries /api/weather/forecast with location parameter.');

  // 4. Verify Coordinate Support (GPS Location)
  console.log('\n4. Auditing GPS / Coordinate Weather Dispatch:');
  let coordUrl = '';
  global.fetch = async (url) => {
    coordUrl = url;
    return {
      ok: true,
      json: async () => ({
        success: true,
        location: { latitude: 18.5204, longitude: 73.8567, name: 'Current Location' },
        current: { temperature: 31 }
      })
    };
  };

  await fetchWeather('GPS Location', 'Maharashtra', { latitude: 18.5204, longitude: 73.8567 });
  assert.ok(coordUrl.includes('latitude=18.5204'));
  assert.ok(coordUrl.includes('longitude=73.8567'));
  console.log('  ✅ [PASS] GPS Coordinates (latitude, longitude) forwarded cleanly to weather service.');

  // 5. Verify Graceful Error Handling on HTTP 500
  console.log('\n5. Auditing Resilient Error Handling on Network/Upstream Failure:');
  global.fetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(
    async () => await fetchWeather('Pune', 'Maharashtra'),
    /Failed to load weather: HTTP 503/
  );
  console.log('  ✅ [PASS] Non-200 upstream response throws structured, catchable error without crashing.');

  // 6. Verify Direct Open-Meteo Client Fallback
  console.log('\n6. Auditing Direct Open-Meteo Fallback Parser:');
  global.fetch = async (url) => {
    assert.ok(url.includes('api.open-meteo.com/v1/forecast'));
    return {
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 29.4,
          apparent_temperature: 31.2,
          relative_humidity_2m: 58,
          precipitation: 0.0,
          wind_speed_10m: 14.2,
          weather_code: 2,
          is_day: 1
        },
        daily: {
          precipitation_probability_max: [15]
        }
      })
    };
  };

  const directRes = await fetchDirectOpenMeteo({ latitude: 18.5204, longitude: 73.8567, name: 'Pune' });
  assert.strictEqual(directRes.current.temperature, 29);
  assert.strictEqual(directRes.current.feelsLike, 31);
  assert.strictEqual(directRes.current.humidity, 58);
  assert.strictEqual(directRes.current.windSpeed, 14);
  assert.strictEqual(directRes.current.condition, 'Partly Cloudy');
  assert.strictEqual(directRes.rainChance, 15);
  console.log('  ✅ [PASS] Direct Open-Meteo client fallback accurately transforms raw Open-Meteo payload.');

} finally {
  global.fetch = originalFetch;
}

console.log('\n======================================================');
console.log('🎉 All Live Weather & Refresh Tests Passed with 100% Success!');
console.log('======================================================\n');
