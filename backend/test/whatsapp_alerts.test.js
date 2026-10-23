/**
 * whatsapp_alerts.test.js
 * Automated Tests for WhatsApp Alert Dispatch Simulator & Mandi Gate Pass Integration
 * Connects Weather Rain Advisory (>60% rain warning) and Mandi Gate Pass
 * HarvestMitra AI
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const alertService = require('../services/alertService');
const weatherService = require('../services/weatherService');

let server;
let serverPort;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      serverPort = server.address().port;
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

function makeRequest({ method = 'GET', path = '/', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      ...(payload
        ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        }
        : {}),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (_) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runWhatsAppAlertTests() {
  console.log('\n======================================================');
  console.log('📲 HarvestMitra AI — WhatsApp Alert Dispatch Simulator Tests');
  console.log('Task: Mandi Gate Pass & Weather Advisory (>60%) Integration');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(msg) {
    passed++;
    console.log(`  ✅ [PASS] ${msg}`);
  }

  function fail(msg, err) {
    failed++;
    console.error(`  ❌ [FAIL] ${msg}`);
    console.error(`         → ${err.message || err}`);
  }

  // -------------------------------------------------------------------------
  // Part 1: Service-Level Gate Pass WhatsApp Template Generation
  // -------------------------------------------------------------------------
  console.log('--- [Part 1] Service Unit Tests: Mandi Gate Pass Alert Generation ---');

  try {
    const alert = await alertService.generateGatePassWhatsAppAlert({
      gatePassCode: 'MH-APMC-908123',
      farmerName: 'Ramesh Patil',
      farmerPhone: '+91 98220 12345',
      cropName: 'Tomato',
      weightKg: 1500,
      pickupLocation: 'Haveli, Pune',
      destinationMarket: 'Mumbai Vashi Mega APMC',
      pickupDate: '2026-10-22',
      driverName: 'Sanjay Shinde',
      driverPhone: '+91 98220 99887',
      vehicleNumber: 'MH-12-RN-4120',
      vehicleType: 'Tata 407 (Agri Freight)',
      language: 'en',
      rainProbability: 25 // Below 60% threshold
    });

    assert.strictEqual(alert.success, true);
    assert.strictEqual(alert.status, 'DELIVERED');
    assert.strictEqual(alert.channel, 'WhatsApp Cloud API');
    assert.ok(alert.messageId.startsWith('wamid.'));
    assert.ok(alert.alertId.startsWith('HM-WAPASS-'));
    assert.strictEqual(alert.gatePass.gatePassCode, 'MH-APMC-908123');
    assert.strictEqual(alert.gatePass.crop, 'Tomato');
    assert.strictEqual(alert.gatePass.weightKg, 1500);
    assert.ok(alert.qrLink.includes('MH-APMC-908123'), 'QR Link must include gate pass token');
    assert.ok(alert.message.includes('MH-APMC-908123'), 'WhatsApp template must contain pass code');
    assert.ok(alert.message.includes('Ramesh Patil'), 'WhatsApp template must contain farmer name');
    assert.ok(alert.message.includes('Mumbai Vashi Mega APMC'), 'WhatsApp template must contain destination APMC');
    assert.strictEqual(alert.isRainAdvisoryAttached, false, 'Rain advisory should NOT be attached when rain prob < 60%');

    pass('Test 1: Standard Mandi Gate Pass WhatsApp template generated with QR link and pickup details');
  } catch (err) {
    fail('Test 1: Standard Gate Pass generation', err);
  }

  // -------------------------------------------------------------------------
  // Part 2: Weather Rain Advisory (>60%) Integration
  // -------------------------------------------------------------------------
  console.log('\n--- [Part 2] Rain Advisory Connection (>60% Rain Warning) ---');

  try {
    const rainyAlert = await alertService.generateGatePassWhatsAppAlert({
      gatePassCode: 'MH-APMC-776655',
      farmerName: 'Balasaheb Shinde',
      cropName: 'Onion',
      weightKg: 2000,
      pickupLocation: 'Niphad, Nashik',
      destinationMarket: 'Mumbai Vashi Mega APMC',
      language: 'mr',
      rainProbability: 75 // Exceeds 60% threshold -> MUST trigger rain warning!
    });

    assert.strictEqual(rainyAlert.success, true);
    assert.strictEqual(rainyAlert.isRainAdvisoryAttached, true, 'Rain advisory MUST be attached when rain prob >= 60%');
    assert.strictEqual(rainyAlert.rainProbability, 75);
    assert.ok(rainyAlert.message.includes('75%'), 'Message must mention 75% rain probability');
    assert.ok(
      rainyAlert.message.includes('पाऊस सतर्कता') || rainyAlert.message.includes('ताडपत्री'),
      'Marathi message must contain rain warning advisory instructions'
    );
    assert.strictEqual(rainyAlert.weatherAdvisory.isRainWarning, true);
    assert.strictEqual(rainyAlert.weatherAdvisory.level, 'RAIN_ADVISORY');

    pass('Test 2: Heavy Rain Advisory (>60% threshold) correctly attached to WhatsApp Gate Pass alert');
  } catch (err) {
    fail('Test 2: Heavy Rain Advisory connection', err);
  }

  // -------------------------------------------------------------------------
  // Part 3: Multilingual Support (Marathi, Hindi, English, Gujarati)
  // -------------------------------------------------------------------------
  console.log('\n--- [Part 3] Multilingual Template Generation (mr, hi, en, gu) ---');

  const testLangs = [
    { code: 'mr', name: 'Marathi', keyMarker: 'डिजिटल एपीएमसी मंडी गेट पास', weatherMarker: 'पाऊस सतर्कता' },
    { code: 'hi', name: 'Hindi', keyMarker: 'डिजिटल एपीएमसी मंडी गेट पास', weatherMarker: 'भारी बारिश चेतावनी' },
    { code: 'en', name: 'English', keyMarker: 'Digital APMC Mandi Gate Pass', weatherMarker: 'Heavy rain probability' },
    { code: 'gu', name: 'Gujarati', keyMarker: 'ડિજિટલ એપીએમસી માર્કેટિંગ યાર્ડ ગેટ પાસ', weatherMarker: 'ભારે વરસાદ' }
  ];

  for (const lang of testLangs) {
    try {
      const multiAlert = await alertService.generateGatePassWhatsAppAlert({
        farmerName: 'Kisan Demo',
        cropName: 'Cotton',
        pickupLocation: 'Wardha',
        destinationMarket: 'Nagpur APMC',
        language: lang.code,
        rainProbability: 70
      });

      assert.strictEqual(multiAlert.success, true);
      assert.ok(multiAlert.message.includes(lang.keyMarker), `Template in ${lang.name} must include "${lang.keyMarker}"`);
      assert.ok(multiAlert.message.includes(lang.weatherMarker), `Template in ${lang.name} must include "${lang.weatherMarker}"`);
      assert.ok(multiAlert.qrLink.startsWith('https://harvestmitra.in/gatepass?code='));

      pass(`Test 3 [${lang.code.toUpperCase()}]: ${lang.name} WhatsApp Gate Pass & Rain Alert template verified`);
    } catch (err) {
      fail(`Test 3 [${lang.code.toUpperCase()}]: Multilingual generation`, err);
    }
  }

  // -------------------------------------------------------------------------
  // Part 4: Standalone Weather Rain Advisory WhatsApp Alert Simulator
  // -------------------------------------------------------------------------
  console.log('\n--- [Part 4] Standalone Weather Rain Advisory Dispatch Simulator ---');

  try {
    const wxAlert = await alertService.sendWeatherWhatsAppAlert({
      district: 'Surat',
      state: 'Gujarat',
      rainProbability: 70,
      farmerName: 'Mukeshbhai Patel'
    });

    assert.strictEqual(wxAlert.success, true);
    assert.strictEqual(wxAlert.status, 'DELIVERED');
    assert.strictEqual(wxAlert.channel, 'WhatsApp Cloud API');
    assert.ok(wxAlert.messageId.startsWith('wamid.'));
    assert.ok(wxAlert.message.includes('Surat'));
    assert.strictEqual(wxAlert.isRainWarning, true);

    pass('Test 4: Standalone Weather WhatsApp alert generated and delivered via simulated WhatsApp Cloud API');
  } catch (err) {
    fail('Test 4: Standalone Weather alert simulator', err);
  }

  // -------------------------------------------------------------------------
  // Part 5: HTTP Endpoint Integration: POST /api/alerts/whatsapp/send-gatepass
  // -------------------------------------------------------------------------
  console.log('\n--- [Part 5] HTTP API Endpoint: POST /api/alerts/whatsapp/send-gatepass ---');

  process.env.ENABLE_GUEST_MODE = 'true';
  const authHeaders = { Authorization: 'Bearer guest' };

  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/alerts/whatsapp/send-gatepass',
      headers: authHeaders,
      body: {
        farmerName: 'Varun Patil',
        farmerPhone: '+91 98229 44120',
        cropName: 'Tomato',
        weightKg: 1200,
        pickupLocation: 'Haveli, Pune',
        destinationMarket: 'Mumbai Vashi APMC',
        pickupDate: '2026-10-23',
        driverName: 'Santosh Gaikwad',
        vehicleNumber: 'MH-15-TC-8821',
        language: 'mr',
        rainProbability: 68 // >60%
      }
    });

    assert.strictEqual(res.status, 200, 'Endpoint should return HTTP 200');
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'DELIVERED');
    assert.ok(res.body.gatePass.qrLink.includes('https://harvestmitra.in/gatepass?code='));
    assert.strictEqual(res.body.isRainAdvisoryAttached, true);
    assert.strictEqual(res.body.rainProbability, 68);
    assert.ok(res.body.message.includes('1200 kg Tomato'));
    assert.ok(res.body.message.includes('Santosh Gaikwad'));
    assert.ok(res.body.messageId.startsWith('wamid.'));

    pass('Test 5: POST /api/alerts/whatsapp/send-gatepass returns HTTP 200 with complete WhatsApp payload');
  } catch (err) {
    fail('Test 5: POST /api/alerts/whatsapp/send-gatepass', err);
  }

  try {
    // Missing required parameters check
    const badRes = await makeRequest({
      method: 'POST',
      path: '/api/alerts/whatsapp/send-gatepass',
      headers: authHeaders,
      body: {}
    });

    assert.strictEqual(badRes.status, 400, 'Should return HTTP 400 for empty request');
    assert.strictEqual(badRes.body.success, false);
    assert.ok(badRes.body.error, 'Must provide validation error message');

    pass('Test 6: POST /api/alerts/whatsapp/send-gatepass validates missing input and returns HTTP 400');
  } catch (err) {
    fail('Test 6: Missing input validation', err);
  }

  // -------------------------------------------------------------------------
  // Part 6: Open-Meteo Weather Service Whatsapp Alert Preview Verification
  // -------------------------------------------------------------------------
  console.log('\n--- [Part 6] Weather Service Rain Alert WhatsApp Preview ---');

  try {
    // District with high rain probability in demo data or simulated
    const suratAlerts = await weatherService.getRainAlerts({ district: 'Surat' });
    assert.strictEqual(suratAlerts.success, true);
    if (suratAlerts.rainProbability >= 60) {
      assert.ok(suratAlerts.whatsappAlertPreview, 'Heavy rain district must include whatsappAlertPreview');
      assert.strictEqual(suratAlerts.whatsappAlertPreview.channel, 'WhatsApp Cloud API');
      assert.strictEqual(suratAlerts.whatsappAlertPreview.isHeavyRain, true);
      pass(`Test 7: weatherService.getRainAlerts includes WhatsApp alert preview for Surat (${suratAlerts.rainProbability}% rain)`);
    } else {
      pass(`Test 7: weatherService.getRainAlerts evaluated Surat (${suratAlerts.rainProbability}% rain)`);
    }
  } catch (err) {
    fail('Test 7: weatherService getRainAlerts whatsapp preview', err);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  if (failed === 0) {
    console.log(`🎉 All ${passed} WhatsApp Alert Simulator Tests Passed Successfully with 0 Errors!`);
    console.log('Mandi Gate Pass & Weather Advisory WhatsApp Integration Verified.');
  } else {
    console.error(`⚠️ Test Run Completed: ${passed} Passed, ${failed} Failed.`);
  }
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  try {
    await startServer();
    await runWhatsAppAlertTests();
  } catch (fatal) {
    console.error('Fatal Test Runner Error:', fatal);
    process.exit(1);
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  main();
}

module.exports = { runWhatsAppAlertTests };
