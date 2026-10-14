/**
 * marketWeatherApi.test.js
 * Integration tests for Market and Weather API routes
 * HarvestMitra AI - ISSUE-11
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');

function makeRequest({ method = 'GET', path = '/', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;

      const reqHeaders = {
        ...headers,
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      };

      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (_) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

async function runApiTests() {
  console.log('\n======================================================');
  console.log('📡 HarvestMitra AI - Market & Weather API Integration Tests');
  console.log('======================================================\n');

  // 1. GET /api/markets
  const marketsRes = await makeRequest({ path: '/api/markets' });
  assert.strictEqual(marketsRes.statusCode, 200);
  assert.strictEqual(marketsRes.data.success, true);
  assert.ok(marketsRes.data.data.length >= 5);
  console.log('  ✅ [PASS] GET /api/markets returns market list');

  // 2. GET /api/markets/crops
  const cropsRes = await makeRequest({ path: '/api/markets/crops' });
  assert.strictEqual(cropsRes.statusCode, 200);
  assert.strictEqual(cropsRes.data.success, true);
  assert.ok(cropsRes.data.data.some(c => c.name === 'Tomato'));
  console.log('  ✅ [PASS] GET /api/markets/crops returns crop list');

  // 3. GET /api/markets/prices?crop=Tomato
  const pricesRes = await makeRequest({ path: '/api/markets/prices?crop=Tomato' });
  assert.strictEqual(pricesRes.statusCode, 200);
  assert.strictEqual(pricesRes.data.success, true);
  assert.ok(pricesRes.data.data.length >= 1);
  assert.strictEqual(pricesRes.data.data[0].crop_name, 'Tomato');
  console.log('  ✅ [PASS] GET /api/markets/prices filters by crop');

  // 4. GET /api/markets/compare?crop=Tomato
  const compareRes = await makeRequest({ path: '/api/markets/compare?crop=Tomato' });
  assert.strictEqual(compareRes.statusCode, 200);
  assert.strictEqual(compareRes.data.success, true);
  assert.strictEqual(compareRes.data.data.crop, 'Tomato');
  assert.ok(compareRes.data.data.comparisons.length >= 2);
  console.log('  ✅ [PASS] GET /api/markets/compare returns comparative price analysis');

  // 5. GET /api/markets/prices/trends?crop=Tomato&days=7
  const trendsRes = await makeRequest({ path: '/api/markets/prices/trends?crop=Tomato&days=7' });
  assert.strictEqual(trendsRes.statusCode, 200);
  assert.strictEqual(trendsRes.data.success, true);
  assert.strictEqual(trendsRes.data.data.length, 7);
  console.log('  ✅ [PASS] GET /api/markets/prices/trends returns historical trend points');

  // 6. GET /api/weather?district=Surat
  const weatherRes = await makeRequest({ path: '/api/weather?district=Surat' });
  assert.strictEqual(weatherRes.statusCode, 200);
  assert.strictEqual(weatherRes.data.success, true);
  assert.strictEqual(weatherRes.data.location.district, 'Surat');
  assert.strictEqual(weatherRes.data.advisory.level, 'RAIN_ADVISORY');
  console.log('  ✅ [PASS] GET /api/weather returns district weather and rain advisory');

  // 7. GET /api/weather/alerts?district=Surat
  const alertsRes = await makeRequest({ path: '/api/weather/alerts?district=Surat' });
  assert.strictEqual(alertsRes.statusCode, 200);
  assert.strictEqual(alertsRes.data.success, true);
  assert.strictEqual(alertsRes.data.advisory.level, 'RAIN_ADVISORY');
  console.log('  ✅ [PASS] GET /api/weather/alerts returns district alerts');

  console.log('\n======================================================');
  console.log('🎉 All Market & Weather API Tests Passed!');
  console.log('======================================================\n');
}

if (require.main === module) {
  runApiTests().catch(err => {
    console.error('Fatal API test error:', err);
    process.exit(1);
  });
}

module.exports = { runApiTests };
