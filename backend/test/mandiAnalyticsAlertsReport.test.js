/**
 * mandiAnalyticsAlertsReport.test.js
 * Verification Test Suite for Issues #76, #77, #78
 * Assigned to: Prashant Warule
 *
 * Covers:
 * 1. APMC Live Mandi Data Auto-Sync & Moving Average Trend Aggregator (#76)
 * 2. Price Surge / Drop Alert Simulator with Multilingual Payloads (#77)
 * 3. Printable Farm Decision Summary Report API (#78)
 */

const assert = require('assert');
const marketService = require('../services/marketService');
const alertService = require('../services/alertService');
const farmReportService = require('../services/farmReportService');

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🌾 HarvestMitra AI — Issues #76, #77, #78 Test Suite');
  console.log('Lead Architect: Prashant Warule (@prashantwarule0310)');
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
  // ISSUE #76: APMC Auto-Sync & Moving Average Trends
  // -------------------------------------------------------------------------
  console.log('--- [ISSUE #76] APMC Auto-Sync & Moving Average Trend Aggregator ---');

  try {
    const syncRes = await marketService.syncLiveApmcRates({ state: 'Maharashtra' });
    assert.strictEqual(syncRes.success, true, 'Auto-sync should return success');
    assert(syncRes.recordsUpdated > 0, 'Auto-sync should update database records');
    assert(syncRes.marketsCount > 0, 'Auto-sync should detect Maharashtra markets');
    assert(syncRes.cropsCount > 0, 'Auto-sync should process crops');
    assert.strictEqual(syncRes.state, 'Maharashtra', 'State should be Maharashtra');
    pass(`Test 1: APMC Live Auto-Sync refreshed ${syncRes.recordsUpdated} rates across ${syncRes.marketsCount} mandis`);
  } catch (err) {
    fail('Test 1: APMC Live Auto-Sync', err);
  }

  try {
    const syncStatus = await marketService.getSyncStatus();
    assert.strictEqual(syncStatus.success, true);
    assert.strictEqual(syncStatus.syncEngine.autoSyncEnabled, true);
    assert(syncStatus.stats.totalActivePrices > 0);
    pass(`Test 2: Auto-Sync Engine status reports ${syncStatus.stats.totalActivePrices} active verified prices`);
  } catch (err) {
    fail('Test 2: Auto-Sync Engine status', err);
  }

  try {
    const trends = await marketService.getMovingAverageTrends({
      crop: 'Cotton',
      market: 'Pune APMC (Gultekdi)',
      days: 14
    });

    assert.strictEqual(trends.crop, 'Cotton');
    assert.strictEqual(trends.market, 'Pune APMC (Gultekdi)');
    assert.strictEqual(trends.days, 14);
    assert.strictEqual(trends.points.length, 14, 'Should contain 14 daily data points');
    assert(['BULLISH', 'BEARISH', 'STABLE'].includes(trends.trendDirection), 'Valid trend direction');
    assert(trends.sma3 > 0, 'SMA-3 must be positive');
    assert(trends.sma7 > 0, 'SMA-7 must be positive');
    assert(trends.sma14 > 0, 'SMA-14 must be positive');
    assert(trends.ema7 > 0, 'EMA-7 must be positive');
    assert(typeof trends.volatilityPercentage === 'number', 'Volatility must be computed');
    assert(trends.recommendation && trends.recommendation.action, 'Recommendation action must be present');

    // Math verification on SMA-3 for last point
    const pts = trends.points;
    const last3Mean = (pts[11].pricePerKg + pts[12].pricePerKg + pts[13].pricePerKg) / 3;
    assert(Math.abs(pts[13].sma3 - last3Mean) < 0.05, 'SMA-3 arithmetic accuracy verified');

    pass(`Test 3: Moving Average Trend Aggregator (SMA3: ₹${trends.sma3}, SMA7: ₹${trends.sma7}, Trend: ${trends.trendDirection}, Volatility: ${trends.volatilityPercentage}%)`);
  } catch (err) {
    fail('Test 3: Moving Average Trend Aggregator', err);
  }

  // -------------------------------------------------------------------------
  // ISSUE #77: Price Surge / Drop Alert Simulator (Multilingual WhatsApp & SMS)
  // -------------------------------------------------------------------------
  console.log('\n--- [ISSUE #77] Price Surge & Drop Alert Simulator (Multilingual) ---');

  const languages = ['mr', 'hi', 'gu', 'en'];
  for (const lang of languages) {
    try {
      const alert = await alertService.simulatePriceAlert({
        crop: 'Cotton',
        market: 'Nashik APMC',
        district: 'Nashik',
        state: 'Maharashtra',
        currentPrice: 84.0,
        baselinePrice: 75.0, // +12% surge
        thresholdPercent: 5.0,
        language: lang,
        farmerName: 'Ramesh Patel',
        farmerPhone: '+91 98765 43210'
      });

      assert.strictEqual(alert.alertType, 'PRICE_SURGE');
      assert.strictEqual(alert.severity, 'HIGH');
      assert(alert.percentChange === 12.0);
      assert(alert.notifications.whatsapp.message.includes('84'), 'WhatsApp message should contain current price');
      assert(alert.notifications.sms.message.length <= 160, `SMS in ${lang} must be within 160 GSM chars limit (actual: ${alert.notifications.sms.message.length})`);
      assert(alert.notifications.sms.isWithinGsmLimit, 'isWithinGsmLimit must be true');

      pass(`Test 4 [${lang.toUpperCase()}]: Price Surge Alert generated with WhatsApp & GSM-safe SMS payload (${alert.notifications.sms.charCount} chars)`);
    } catch (err) {
      fail(`Test 4 [${lang.toUpperCase()}]: Price Surge Alert`, err);
    }
  }

  try {
    const dropAlert = await alertService.simulatePriceAlert({
      crop: 'Tomato',
      market: 'Lasalgaon APMC',
      district: 'Nashik',
      currentPrice: 18.0,
      baselinePrice: 22.0, // -18.18% drop
      thresholdPercent: 5.0,
      language: 'mr'
    });

    assert.strictEqual(dropAlert.alertType, 'PRICE_DROP');
    assert.strictEqual(dropAlert.severity, 'HIGH');
    assert(dropAlert.percentChange < -5.0);
    assert(dropAlert.advisoryNote.includes('सावधगिरी') || dropAlert.advisoryNote.includes('गोदाम'), 'Advice includes cautious storage');
    assert(dropAlert.notifications.sms.charCount <= 160);
    pass(`Test 5: Price Drop Alert correctly flags downside risk (${dropAlert.percentChange}%) and generates cold-storage advisory`);
  } catch (err) {
    fail('Test 5: Price Drop Alert', err);
  }

  try {
    const sampleAlert = await alertService.simulatePriceAlert({ crop: 'Soybean', forceSurge: true });
    const dispatchRes = await alertService.dispatchAlert(sampleAlert, ['whatsapp', 'sms']);
    assert.strictEqual(dispatchRes.success, true);
    assert.strictEqual(dispatchRes.channels.whatsapp.status, 'DELIVERED');
    assert.strictEqual(dispatchRes.channels.sms.status, 'DELIVERED');
    assert(dispatchRes.channels.whatsapp.messageId.startsWith('wamid.'));
    assert(dispatchRes.channels.sms.messageId.startsWith('SMS-'));
    pass(`Test 6: Notification Dispatch Simulator successfully dispatches to WhatsApp Cloud & National SMS Gateway`);
  } catch (err) {
    fail('Test 6: Notification Dispatch Simulator', err);
  }

  try {
    const activeAlerts = await alertService.getActiveMarketAlerts({ state: 'Maharashtra', thresholdPercent: 3.5 });
    assert.strictEqual(activeAlerts.success, true);
    assert(Array.isArray(activeAlerts.alerts));
    pass(`Test 7: Active APMC Market Scanner detected ${activeAlerts.count} price movement alerts across Maharashtra mandis`);
  } catch (err) {
    fail('Test 7: Active APMC Market Scanner', err);
  }

  // -------------------------------------------------------------------------
  // ISSUE #78: Printable Farm Decision Summary Report API
  // -------------------------------------------------------------------------
  console.log('\n--- [ISSUE #78] Printable Farm Decision Summary Report API ---');

  let reportData = null;
  try {
    reportData = await farmReportService.generateFarmDecisionReport({
      farmerName: 'Ramesh Patel',
      phone: '+91 98765 43210',
      village: 'Bardoli',
      district: 'Surat',
      crop: 'Tomato',
      quantityKg: 1500,
      localPricePerKg: 18.0,
      futurePricePerKg: 21.0,
      regionalPricePerKg: 28.0,
      transportCostLocal: 1500,
      packagingCost: 600,
      laborCost: 450,
      transportCostRegionalShared: 2500
    });

    assert.strictEqual(reportData.success, true);
    assert(reportData.reportId.startsWith('HM-REP-'));
    assert.strictEqual(reportData.farmer.name, 'Ramesh Patel');
    assert.strictEqual(reportData.farmer.quantityKg, 1500);

    const sc = reportData.financialScenarios;
    assert(sc.option1_sellToday, 'Option 1 must exist');
    assert(sc.option2_holdAndSellLater, 'Option 2 must exist');
    assert(sc.option3_regionalMandiSharedTransport, 'Option 3 must exist');

    // Math integrity checks
    const opt1 = sc.option1_sellToday;
    assert.strictEqual(opt1.grossRevenue, 1500 * 18.0);
    assert.strictEqual(opt1.netRevenue, opt1.grossRevenue - opt1.totalCost);

    const opt3 = sc.option3_regionalMandiSharedTransport;
    assert.strictEqual(opt3.grossRevenue, 1500 * 28.0);
    assert.strictEqual(opt3.netRevenue, opt3.grossRevenue - opt3.totalCost);

    assert(reportData.recommendation.winningOption, 'Winning option must be identified');
    assert(reportData.recommendation.netAdvantage >= 0, 'Net advantage must be non-negative');

    pass(`Test 8: Farm Decision Summary Report generated (Winning: ${reportData.recommendation.winningOption}, Net Advantage: +₹${reportData.recommendation.netAdvantage.toLocaleString('en-IN')})`);
  } catch (err) {
    fail('Test 8: Farm Decision Summary Report generation', err);
  }

  try {
    const htmlOutput = farmReportService.renderPrintableHtml(reportData);
    assert(htmlOutput.includes('<!DOCTYPE html>'), 'Must produce valid HTML document');
    assert(htmlOutput.includes('@media print'), 'Must include print media stylesheet');
    assert(htmlOutput.includes('HarvestMitra AI'), 'Must include brand header');
    assert(htmlOutput.includes('Ramesh Patel'), 'Must include farmer details');
    assert(htmlOutput.includes('Option 3'), 'Must render three-scenario comparison table');
    assert(htmlOutput.includes('DIGITAL SECURITY & APMC VERIFICATION SEAL'), 'Must include digital verification seal');
    assert(htmlOutput.includes('Farmer Signature'), 'Must include signature area');
    assert(htmlOutput.includes('window.print()'), 'Must include print trigger handler');

    pass(`Test 9: Printable Farm Decision HTML Document rendered (${htmlOutput.length} bytes, A4-ready layout with verification seal)`);
  } catch (err) {
    fail('Test 9: Printable Farm Decision HTML Document rendering', err);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  if (failed === 0) {
    console.log(`🎉 All ${passed} Tests Passed Successfully with 0 Errors!`);
    console.log('Issues #76, #77, and #78 Verified & Complete.');
  } else {
    console.error(`⚠️ Test Run Completed: ${passed} Passed, ${failed} Failed.`);
  }
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Execution Error:', err);
  process.exit(1);
});
