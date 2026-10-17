const assert = require('assert');
const { getMandiPriceTrends } = require('../services/mandiSyncService');
const { generatePriceAlerts } = require('../services/alertEngine');

async function testSuite() {
  console.log('Testing mandiSyncService...');
  const trend = await getMandiPriceTrends('Tomato', 'Gujarat');
  assert.ok(trend.currentBenchmark, 'Benchmark price exists');
  assert.ok(trend.trendSpreadPct, 'Trend spread calculated');
  console.log('✅ Trend Analytics passed!');

  console.log('Testing alertEngine...');
  const alert = generatePriceAlerts({ cropName: 'Tomato', currentPrice: 35.0, targetHigh: 30.0, lang: 'gu' });
  assert.strictEqual(alert.triggered, true, 'Surge alert triggered');
  assert.strictEqual(alert.severity, 'HIGH_POSITIVE');
  console.log('✅ Alert Engine passed!');
}

testSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
