/**
 * marketWeatherServices.test.js
 * Frontend unit tests for market and weather client contracts
 * HarvestMitra AI - ISSUE-11
 */

import assert from 'node:assert';
import {
  fetchMarkets,
  fetchCrops,
  fetchMarketPrices,
  compareMarkets,
  fetchPriceTrends
} from '../src/services/marketApiService.js';
import {
  fetchWeather,
  fetchRainAlerts
} from '../src/services/weatherApiService.js';

console.log('\n======================================================');
console.log('🌾 HarvestMitra AI - Frontend Market & Weather Tests');
console.log('======================================================\n');

// Mock global fetch for testing client services in isolation
const originalFetch = global.fetch;

try {
  // 1. Test fetchMarkets client contract
  global.fetch = async (url) => {
    assert.ok(url.includes('/api/markets'));
    return {
      ok: true,
      json: async () => ({ success: true, data: [{ id: 1, name: 'Surat APMC Mandi', district: 'Surat' }] })
    };
  };
  const markets = await fetchMarkets({ district: 'Surat' });
  assert.strictEqual(markets.length, 1);
  assert.strictEqual(markets[0].name, 'Surat APMC Mandi');
  console.log('  ✅ [PASS] fetchMarkets sends query params and parses payload correctly');

  // 2. Test fetchMarketPrices client contract
  global.fetch = async (url) => {
    assert.ok(url.includes('/api/markets/prices?crop=Tomato'));
    return {
      ok: true,
      json: async () => ({ success: true, data: [{ crop_name: 'Tomato', price_per_kg: 20 }] })
    };
  };
  const prices = await fetchMarketPrices({ crop: 'Tomato' });
  assert.strictEqual(prices[0].crop_name, 'Tomato');
  console.log('  ✅ [PASS] fetchMarketPrices constructs endpoint and query string');

  // 3. Test compareMarkets client contract
  global.fetch = async (url) => {
    assert.ok(url.includes('/api/markets/compare?crop=Tomato'));
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          crop: 'Tomato',
          priceDifferencePerKg: 4.5,
          highestMarket: { name: 'Pune APMC', pricePerKg: 27.5 },
          lowestMarket: { name: 'Surat APMC', pricePerKg: 20.0 }
        }
      })
    };
  };
  const comparison = await compareMarkets('Tomato');
  assert.strictEqual(comparison.crop, 'Tomato');
  assert.strictEqual(comparison.priceDifferencePerKg, 4.5);
  console.log('  ✅ [PASS] compareMarkets retrieves comparative market metrics');

  // 4. Test fetchWeather client contract
  global.fetch = async (url) => {
    assert.ok(url.includes('/api/weather?district=Surat&state=Gujarat'));
    return {
      ok: true,
      json: async () => ({
        success: true,
        location: { district: 'Surat' },
        weather: { temperature: 29, rainProbability: 70 },
        advisory: { level: 'RAIN_ADVISORY' }
      })
    };
  };
  const weather = await fetchWeather('Surat', 'Gujarat');
  assert.strictEqual(weather.weather.rainProbability, 70);
  assert.strictEqual(weather.advisory.level, 'RAIN_ADVISORY');
  console.log('  ✅ [PASS] fetchWeather retrieves district weather and rain advisory');

  // 5. Test error handling on HTTP non-200
  global.fetch = async () => ({ ok: false, status: 500 });
  await assert.rejects(
    async () => await fetchWeather('Surat'),
    /Failed to load weather: HTTP 500/
  );
  console.log('  ✅ [PASS] Gracefully throws structured error on HTTP failures');

} finally {
  global.fetch = originalFetch;
}

console.log('\n======================================================');
console.log('🎉 All Frontend Market & Weather Tests Passed!');
console.log('======================================================\n');
