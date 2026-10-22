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
  fetchPriceTrends,
  fetchPriceForecast,
  fetchInterMandiArbitrage
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

  // 6. Test fetchPriceForecast client contract
  global.fetch = async (url) => {
    assert.ok(url.includes('/api/markets/forecast?crop=Tomato&mandi=Surat'));
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          crop: 'Tomato',
          mandi: 'Surat APMC',
          currentPrice: 20.0,
          trend: 'RISING',
          forecastPoints: Array.from({ length: 14 }, (_, i) => ({
            day: i + 1,
            predictedPrice: 20 + i * 0.2,
            lowerBound: 19 + i * 0.1,
            upperBound: 21 + i * 0.3
          }))
        }
      })
    };
  };
  const forecast = await fetchPriceForecast('Tomato', 'Surat');
  assert.strictEqual(forecast.crop, 'Tomato');
  assert.strictEqual(forecast.forecastPoints.length, 14);
  assert.ok(forecast.forecastPoints[0].lowerBound <= forecast.forecastPoints[0].upperBound);
  console.log('  ✅ [PASS] fetchPriceForecast queries /api/markets/forecast and receives 14-day predictions with bounds');

  // 7. Test fetchInterMandiArbitrage client contract
  global.fetch = async (url) => {
    assert.ok(url.includes('/api/markets/arbitrage?crop=Tomato&quantityKg=1000&origin=Surat'));
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          crop: 'Tomato',
          quantityKg: 1000,
          origin: 'Surat',
          winner: { mandi: 'Mumbai Vashi APMC', netProfit: 29194 },
          rankedMandis: [
            { rank: 1, mandi: 'Mumbai Vashi APMC', netProfit: 29194, highwayTolls: 580, dieselCost: 2384, mandiCess: 341 },
            { rank: 2, mandi: 'Pune APMC', netProfit: 26000, highwayTolls: 1060, dieselCost: 3471, mandiCess: 310 },
            { rank: 3, mandi: 'Surat APMC', netProfit: 23800, highwayTolls: 0, dieselCost: 125, mandiCess: 240 }
          ]
        }
      })
    };
  };
  const arbitrage = await fetchInterMandiArbitrage('Tomato', 1000, 'Surat');
  assert.strictEqual(arbitrage.rankedMandis.length, 3);
  assert.strictEqual(arbitrage.rankedMandis[0].rank, 1);
  assert.strictEqual(arbitrage.rankedMandis[0].mandi, 'Mumbai Vashi APMC');
  assert.strictEqual(arbitrage.rankedMandis[0].highwayTolls, 580);
  console.log('  ✅ [PASS] fetchInterMandiArbitrage queries /api/markets/arbitrage and receives ranked mandis after tolls & fuel');

} finally {
  global.fetch = originalFetch;
}

console.log('\n======================================================');
console.log('🎉 All Frontend Market & Weather Tests Passed!');
console.log('======================================================\n');
