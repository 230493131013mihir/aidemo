/**
 * chatApi.test.js
 * Integration test for Express Chatbot API endpoints
 * HarvestMitra AI - ISSUE-09
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
  console.log('📡 HarvestMitra AI - Chat API Integration Tests');
  console.log('======================================================\n');

  // 1. Test GET /api/chat/status
  const statusRes = await makeRequest({ method: 'GET', path: '/api/chat/status' });
  assert.strictEqual(statusRes.statusCode, 200, 'Status endpoint should return 200');
  assert.strictEqual(statusRes.data.status, 'ok');
  assert.strictEqual(statusRes.data.fallbackReady, true);
  console.log('  ✅ [PASS] GET /api/chat/status returns operational state');

  // 2. Test POST /api/chat/message validation (empty message)
  const emptyRes = await makeRequest({
    method: 'POST',
    path: '/api/chat/message',
    body: { message: '' }
  });
  assert.strictEqual(emptyRes.statusCode, 400, 'Empty message should return 400');
  assert.strictEqual(emptyRes.data.success, false);
  console.log('  ✅ [PASS] POST /api/chat/message rejects empty message with 400');

  // 3. Test POST /api/chat/message with Gujarati query and context
  const guRes = await makeRequest({
    method: 'POST',
    path: '/api/chat/message',
    body: {
      message: 'ટામેટાંનો ભાવ શું છે?',
      language: 'gu',
      context: {
        crop: { name: 'ટામેટાં' },
        marketData: {
          currentMarket: { name: 'Surat APMC Mandi', pricePerKg: 20, unit: 'kg', sourceType: 'DEMO' }
        }
      }
    }
  });

  assert.strictEqual(guRes.statusCode, 200, 'Gujarati message returns 200');
  assert.strictEqual(guRes.data.success, true);
  assert.strictEqual(guRes.data.metadata.language, 'gu');
  assert.strictEqual(guRes.data.metadata.intent, 'market_price');
  assert.ok(guRes.data.message.includes('₹20'), 'Message contains correct price');
  assert.ok(guRes.data.source_disclaimer.length > 0, 'Contains source disclaimer');
  console.log('  ✅ [PASS] POST /api/chat/message processes Gujarati market query');

  // 4. Test POST /api/chat/message with Hindi query and calculation
  const hiRes = await makeRequest({
    method: 'POST',
    path: '/api/chat/message',
    body: {
      message: 'मेरी शुद्ध कमाई का हिसाब बताओ',
      language: 'hi',
      context: {
        calculations: {
          today: { grossRevenue: 15000, totalCost: 2000, netRevenue: 13000 }
        }
      }
    }
  });

  assert.strictEqual(hiRes.statusCode, 200, 'Hindi calculation query returns 200');
  assert.strictEqual(hiRes.data.success, true);
  assert.strictEqual(hiRes.data.metadata.language, 'hi');
  assert.strictEqual(hiRes.data.metadata.intent, 'revenue_calculation');
  assert.ok(hiRes.data.message.includes('13,000'), 'Message contains calculated net revenue');
  console.log('  ✅ [PASS] POST /api/chat/message processes Hindi calculation query');

  // 5. Test POST /api/chat/message with Marathi query and harvest decision
  const mrRes = await makeRequest({
    method: 'POST',
    path: '/api/chat/message',
    body: {
      message: 'माझ्याकडे 500 किलो टोमॅटो आहेत. आज विकावे का?',
      language: 'mr',
      context: {
        crop: { name: 'Tomato', quantityKg: 500 },
        calculations: {
          today: { grossRevenue: 10000, totalCost: 1500, netRevenue: 8500 }
        }
      }
    }
  });

  assert.strictEqual(mrRes.statusCode, 200, 'Marathi harvest decision returns 200');
  assert.strictEqual(mrRes.data.success, true);
  assert.strictEqual(mrRes.data.metadata.language, 'mr', 'Language must be mr');
  assert.strictEqual(mrRes.data.metadata.intent, 'harvest_decision');
  assert.ok(mrRes.data.message.includes('8,500'), 'Message contains calculated net revenue');
  assert.ok(mrRes.data.source_disclaimer.includes('बाजार भाव आणि आकडेवारी'), 'Contains Marathi disclaimer');
  console.log('  ✅ [PASS] POST /api/chat/message processes Marathi harvest decision query');

  console.log('\n======================================================');
  console.log('🎉 All Chat API Integration Tests Passed!');
  console.log('======================================================\n');
}

if (require.main === module) {
  runApiTests().catch(err => {
    console.error('Fatal API test error:', err);
    process.exit(1);
  });
}

module.exports = { runApiTests };
