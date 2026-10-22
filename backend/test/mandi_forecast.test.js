/**
 * mandi_forecast.test.js
 * Unit & Integration Tests for:
 * 1. 14-Day Crop Price Forecasting Model (Moving Averages + Linear Regression)
 * 2. Inter-Mandi Arbitrage Engine (Surat, Pune, Mumbai Vashi APMC with tolls, fuel, cess)
 * HarvestMitra AI
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const {
  get14DayPriceForecast,
  getInterMandiArbitrage,
  resolveMarket,
  resolveCrop,
  DIESEL_PRICE_PER_LITRE,
  VEHICLE_MILEAGE_KM_PER_LITRE
} = require('../services/mandiForecastService');

// Helper to make local HTTP requests to Express app without external network
function makeLocalRequest(server, path) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr.port;
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
  });
}

async function runForecastAndArbitrageTests() {
  console.log('\n======================================================');
  console.log('🔮 HarvestMitra AI — 14-Day Forecast & Arbitrage Tests');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. UNIT TEST: resolveCrop & resolveMarket
  // -----------------------------------------------------------------
  console.log('--- 1. Market & Crop Resolver Tests ---');
  const suratMarket = await resolveMarket('Surat');
  assert.ok(suratMarket, 'Surat market must be found');
  assert.match(suratMarket.name, /Surat/i, 'Market name should match Surat');
  console.log('  ✅ [PASS] Market resolver identifies Surat APMC');

  const puneMarket = await resolveMarket('Pune APMC');
  assert.ok(puneMarket, 'Pune market must be found');
  assert.match(puneMarket.name, /Pune/i);
  console.log('  ✅ [PASS] Market resolver identifies Pune APMC');

  const vashiMarket = await resolveMarket('Mumbai Vashi');
  assert.ok(vashiMarket, 'Mumbai Vashi market must be found');
  assert.match(vashiMarket.name, /Mumbai|Vashi/i);
  console.log('  ✅ [PASS] Market resolver identifies Mumbai Vashi APMC');

  const tomatoCrop = await resolveCrop('Tomato');
  assert.ok(tomatoCrop, 'Tomato crop must be found');
  console.log('  ✅ [PASS] Crop resolver identifies Tomato');

  // -----------------------------------------------------------------
  // 2. UNIT TEST: 14-Day Price Forecasting Model
  // -----------------------------------------------------------------
  console.log('\n--- 2. 14-Day Price Prediction Model Tests ---');
  const forecast = await get14DayPriceForecast({ crop: 'Tomato', mandi: 'Surat APMC' });

  assert.strictEqual(forecast.crop, 'Tomato');
  assert.ok(forecast.mandi.includes('Surat'));
  assert.ok(typeof forecast.currentPrice === 'number' && forecast.currentPrice > 0, 'Current price must be positive');
  assert.ok(typeof forecast.projectedPriceDay14 === 'number' && forecast.projectedPriceDay14 > 0, 'Day 14 price must be positive');
  assert.ok(['RISING', 'DROPPING', 'STABLE'].includes(forecast.trend), `Trend must be valid: got ${forecast.trend}`);
  assert.ok(['UP', 'DOWN', 'STABLE'].includes(forecast.trendDirection), `Trend direction must be valid: got ${forecast.trendDirection}`);
  assert.strictEqual(forecast.confidenceLevel, 95);

  assert.ok(Array.isArray(forecast.forecastPoints), 'forecastPoints must be an array');
  assert.strictEqual(forecast.forecastPoints.length, 14, 'Must return exactly 14 predicted points');

  forecast.forecastPoints.forEach((pt, idx) => {
    assert.strictEqual(pt.day, idx + 1, `Day number must be sequential: day ${idx + 1}`);
    assert.ok(typeof pt.predictedPrice === 'number' && pt.predictedPrice > 0, `Point ${idx + 1} must have valid predicted price`);
    assert.ok(typeof pt.lowerBound === 'number' && pt.lowerBound > 0, `Point ${idx + 1} must have positive lowerBound`);
    assert.ok(typeof pt.upperBound === 'number' && pt.upperBound > 0, `Point ${idx + 1} must have positive upperBound`);
    assert.ok(pt.lowerBound <= pt.predictedPrice, `Lower bound (${pt.lowerBound}) must be <= predicted price (${pt.predictedPrice}) on day ${pt.day}`);
    assert.ok(pt.predictedPrice <= pt.upperBound, `Predicted price (${pt.predictedPrice}) must be <= upper bound (${pt.upperBound}) on day ${pt.day}`);
    assert.strictEqual(pt.confidence, 95);
    assert.match(pt.date, /^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD');
  });
  console.log(`  ✅ [PASS] 14-day price prediction generated with valid 95% confidence bounds (Lower <= Predicted <= Upper)`);
  console.log(`     Baseline: ₹${forecast.currentPrice}/kg → Day 14: ₹${forecast.projectedPriceDay14}/kg (${forecast.predictedChangePct > 0 ? '+' : ''}${forecast.predictedChangePct}%, Trend: ${forecast.trend})`);

  // Test forecast on Pune APMC
  const puneForecast = await get14DayPriceForecast({ crop: 'Tomato', mandi: 'Pune' });
  assert.strictEqual(puneForecast.forecastPoints.length, 14);
  console.log('  ✅ [PASS] 14-day forecast evaluates correctly for Pune APMC');

  // -----------------------------------------------------------------
  // 3. UNIT TEST: Inter-Mandi Arbitrage Calculator
  // -----------------------------------------------------------------
  console.log('\n--- 3. Inter-Mandi Arbitrage Engine Tests ---');
  const arbitrage = await getInterMandiArbitrage({
    crop: 'Tomato',
    quantityKg: 1000,
    origin: 'Surat'
  });

  assert.strictEqual(arbitrage.crop, 'Tomato');
  assert.strictEqual(arbitrage.quantityKg, 1000);
  assert.ok(Array.isArray(arbitrage.rankedMandis), 'rankedMandis must be an array');
  assert.strictEqual(arbitrage.rankedMandis.length, 3, 'Must evaluate Surat APMC, Pune APMC, and Mumbai Vashi APMC');

  // Verify all 3 mandis are present
  const mandiNames = arbitrage.rankedMandis.map(m => m.mandi);
  assert.ok(mandiNames.some(n => n.includes('Surat')), 'Must include Surat APMC');
  assert.ok(mandiNames.some(n => n.includes('Pune')), 'Must include Pune APMC');
  assert.ok(mandiNames.some(n => n.includes('Mumbai') || n.includes('Vashi')), 'Must include Mumbai Vashi APMC');
  console.log('  ✅ [PASS] Evaluates all 3 key mandis: Surat APMC, Pune APMC, and Mumbai Vashi APMC');

  // Check logistics deductions for each mandi
  const suratEntry = arbitrage.rankedMandis.find(m => m.mandi.includes('Surat'));
  const mumbaiEntry = arbitrage.rankedMandis.find(m => m.mandi.includes('Mumbai') || m.mandi.includes('Vashi'));
  const puneEntry = arbitrage.rankedMandis.find(m => m.mandi.includes('Pune'));

  // Surat local: tolls = 0
  assert.strictEqual(suratEntry.highwayTolls, 0, 'Surat local toll must be ₹0');
  assert.ok(suratEntry.dieselCost > 0, 'Surat local diesel cost must be > 0');
  assert.ok(suratEntry.mandiCess > 0, 'Surat mandi cess must be > 0');
  assert.strictEqual(suratEntry.mandiCessPercent, 1.0, 'Surat APMC cess is 1.0%');

  // Mumbai Vashi: distance 285 km, tolls 580, cess 1.05%
  assert.strictEqual(mumbaiEntry.distanceKm, 285, 'Mumbai Vashi distance from Surat must be 285 km');
  assert.strictEqual(mumbaiEntry.highwayTolls, 580, 'Mumbai Vashi NH48 tolls must be ₹580');
  assert.strictEqual(mumbaiEntry.mandiCessPercent, 1.05, 'Maharashtra APMC cess is 1.05%');
  const expectedMumbaiDiesel = Math.round((285 / VEHICLE_MILEAGE_KM_PER_LITRE) * DIESEL_PRICE_PER_LITRE * 100) / 100;
  assert.strictEqual(Math.round(mumbaiEntry.dieselCost), Math.round(expectedMumbaiDiesel), 'Diesel fuel cost matches formula');

  // Pune APMC: distance 415 km, tolls 1060, cess 1.05%
  assert.strictEqual(puneEntry.distanceKm, 415, 'Pune distance from Surat must be 415 km');
  assert.strictEqual(puneEntry.highwayTolls, 1060, 'Pune NH48 + Expressway tolls must be ₹1060');

  // Validate Net Take-Home Profit Formula for every mandi:
  // Net Profit = Gross Revenue - (Highway Tolls + Diesel Cost + Mandi Cess)
  arbitrage.rankedMandis.forEach(m => {
    const expectedDeductions = Math.round((m.highwayTolls + m.dieselCost + m.mandiCess) * 100) / 100;
    assert.strictEqual(Math.round(m.totalDeductions), Math.round(expectedDeductions), `Total deductions calculation match for ${m.mandi}`);
    const expectedNet = Math.round((m.grossRevenue - m.totalDeductions) * 100) / 100;
    assert.strictEqual(Math.round(m.netProfit), Math.round(expectedNet), `Net profit calculation match for ${m.mandi}`);
    const expectedRealized = Math.round((m.netProfit / 1000) * 100) / 100;
    assert.strictEqual(m.realizedPerKg, expectedRealized, `Realized per kg match for ${m.mandi}`);
  });
  console.log('  ✅ [PASS] Automatic deductions verified: Highway tolls, Diesel fuel, and Mandi cess accurately deducted');

  // Validate ranking order
  assert.strictEqual(arbitrage.rankedMandis[0].rank, 1);
  assert.strictEqual(arbitrage.rankedMandis[1].rank, 2);
  assert.strictEqual(arbitrage.rankedMandis[2].rank, 3);
  assert.ok(arbitrage.rankedMandis[0].netProfit >= arbitrage.rankedMandis[1].netProfit, 'Rank 1 profit must be >= Rank 2 profit');
  assert.ok(arbitrage.rankedMandis[1].netProfit >= arbitrage.rankedMandis[2].netProfit, 'Rank 2 profit must be >= Rank 3 profit');
  assert.strictEqual(arbitrage.winner.mandi, arbitrage.rankedMandis[0].mandi, 'Winner matches rank 1 mandi');
  console.log(`  ✅ [PASS] Mandis ranked by Net Take-Home Profit. Rank 1: ${arbitrage.winner.mandi} (Net: ₹${arbitrage.winner.netProfit.toLocaleString('en-IN')})`);

  // -----------------------------------------------------------------
  // 4. INTEGRATION TEST: Express API Endpoints
  // -----------------------------------------------------------------
  console.log('\n--- 4. Backend HTTP Endpoint Integration Tests ---');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));

  try {
    // 4a. GET /api/markets/forecast?crop=Tomato&mandi=Surat
    const resForecast = await makeLocalRequest(server, '/api/markets/forecast?crop=Tomato&mandi=Surat');
    assert.strictEqual(resForecast.status, 200, 'GET /api/markets/forecast must return 200');
    assert.strictEqual(resForecast.data.success, true);
    assert.ok(resForecast.data.data.forecastPoints.length === 14, 'Endpoint returns 14 forecast points');
    assert.ok(resForecast.data.data.forecastPoints[0].lowerBound <= resForecast.data.data.forecastPoints[0].upperBound);
    console.log('  ✅ [PASS] GET /api/markets/forecast?crop=Tomato&mandi=Surat returns 14-day predictions with confidence bounds');

    // 4b. GET /api/markets/arbitrage?crop=Tomato&quantityKg=1000
    const resArbitrage = await makeLocalRequest(server, '/api/markets/arbitrage?crop=Tomato&quantityKg=1000');
    assert.strictEqual(resArbitrage.status, 200, 'GET /api/markets/arbitrage must return 200');
    assert.strictEqual(resArbitrage.data.success, true);
    assert.strictEqual(resArbitrage.data.data.rankedMandis.length, 3, 'Endpoint returns 3 ranked mandis');
    assert.strictEqual(resArbitrage.data.data.rankedMandis[0].rank, 1);
    console.log('  ✅ [PASS] GET /api/markets/arbitrage?crop=Tomato&quantityKg=1000 ranks mandis by net take-home profit');

    // 4c. GET /api/market/forecast alias
    const resAlias = await makeLocalRequest(server, '/api/market/forecast?crop=Onion&mandi=Pune');
    assert.strictEqual(resAlias.status, 200);
    assert.strictEqual(resAlias.data.success, true);
    console.log('  ✅ [PASS] GET /api/market/forecast alias endpoint functions correctly');
  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log('🎉 All 14-Day Forecast & Inter-Mandi Arbitrage Tests Passed!');
  console.log('======================================================\n');
}

if (require.main === module) {
  runForecastAndArbitrageTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test Failure:', err);
      process.exit(1);
    });
}

module.exports = { runForecastAndArbitrageTests };
