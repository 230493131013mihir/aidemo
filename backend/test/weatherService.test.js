/**
 * weatherService.test.js
 * Unit tests for weatherService and district rain advisory calculation
 * HarvestMitra AI - ISSUE-11
 */

const assert = require('assert');
const weatherService = require('../services/weatherService');

async function runWeatherTests() {
  console.log('\n======================================================');
  console.log('🌦️ HarvestMitra AI - Weather Service Tests');
  console.log('======================================================\n');

  // 1. Rain Advisory Threshold Calculation: Above Threshold (70% vs 60%)
  const highRainAdvisory = weatherService.generateRainAdvisory(70, 60);
  assert.strictEqual(highRainAdvisory.level, 'RAIN_ADVISORY', 'Must produce RAIN_ADVISORY when prob >= threshold');
  assert.strictEqual(highRainAdvisory.isAdvisoryActive, true);
  assert.strictEqual(highRainAdvisory.rainProbability, 70);
  assert.match(highRainAdvisory.message, /Rain is expected/i);
  assert.ok(highRainAdvisory.actionableTips.length > 0, 'Must provide actionable tips');
  console.log('  ✅ [PASS] Rain probability 70% with 60% threshold triggers RAIN_ADVISORY');

  // 2. Rain Advisory Threshold Calculation: Below Threshold (30% vs 60%)
  const lowRainAdvisory = weatherService.generateRainAdvisory(30, 60);
  assert.strictEqual(lowRainAdvisory.level, 'CLEAR_ADVISORY', 'Must produce CLEAR_ADVISORY when prob < threshold');
  assert.strictEqual(lowRainAdvisory.isAdvisoryActive, false);
  assert.strictEqual(lowRainAdvisory.rainProbability, 30);
  assert.match(lowRainAdvisory.message, /Low rain probability/i);
  console.log('  ✅ [PASS] Rain probability 30% with 60% threshold triggers CLEAR_ADVISORY');

  // 3. Custom Threshold Behavior (75% with 80% threshold -> Clear)
  const customThresholdAdvisory = weatherService.generateRainAdvisory(75, 80);
  assert.strictEqual(customThresholdAdvisory.level, 'CLEAR_ADVISORY', '75% is below 80% threshold');
  console.log('  ✅ [PASS] Custom configurable threshold respected accurately');

  // 4. District Weather Retrieval (Surat)
  const suratWeather = await weatherService.getWeather({ district: 'Surat', state: 'Gujarat' });
  assert.strictEqual(suratWeather.success, true);
  assert.strictEqual(suratWeather.location.district, 'Surat');
  assert.strictEqual(typeof suratWeather.weather.temperature, 'number');
  assert.strictEqual(typeof suratWeather.weather.humidity, 'number');
  assert.strictEqual(suratWeather.weather.rainProbability, 70);
  assert.strictEqual(suratWeather.advisory.level, 'RAIN_ADVISORY');
  assert.strictEqual(suratWeather.dataStatus, 'DEMO');
  console.log('  ✅ [PASS] District weather retrieved for Surat with active rain advisory');

  // 5. District Weather Retrieval with Clear Weather (Ahmedabad: 25% rain)
  const ahmedabadWeather = await weatherService.getWeather({ district: 'Ahmedabad', state: 'Gujarat' });
  assert.strictEqual(ahmedabadWeather.weather.rainProbability, 25);
  assert.strictEqual(ahmedabadWeather.advisory.level, 'CLEAR_ADVISORY');
  console.log('  ✅ [PASS] District weather retrieved for Ahmedabad with clear weather');

  // 6. District Rain Alerts Endpoint
  const alerts = await weatherService.getRainAlerts({ district: 'Surat' });
  assert.strictEqual(alerts.success, true);
  assert.strictEqual(alerts.advisory.level, 'RAIN_ADVISORY');
  assert.ok(alerts.lastUpdated);
  console.log('  ✅ [PASS] getRainAlerts returns focused advisory summary');

  // 7. Missing API credentials safety
  delete process.env.WEATHER_API_KEY;
  const safeFallback = await weatherService.getWeather({ district: 'Nashik' });
  assert.strictEqual(safeFallback.success, true);
  assert.strictEqual(safeFallback.dataStatus, 'DEMO');
  console.log('  ✅ [PASS] Missing credentials seamlessly fall back to demo mode without crashing');

  console.log('\n======================================================');
  console.log('🎉 All Weather Service Tests Passed Successfully!');
  console.log('======================================================\n');
}

if (require.main === module) {
  runWeatherTests().catch(err => {
    console.error('Test failure:', err);
    process.exit(1);
  });
}

module.exports = { runWeatherTests };
