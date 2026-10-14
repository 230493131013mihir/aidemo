/**
 * marketService.test.js
 * Unit tests for marketService
 * HarvestMitra AI - ISSUE-11
 */

const assert = require('assert');
const marketService = require('../services/marketService');

async function runMarketTests() {
  console.log('\n======================================================');
  console.log('📈 HarvestMitra AI - Market Service Tests');
  console.log('======================================================\n');

  // 1. Get all markets
  const allMarkets = await marketService.getAllMarkets();
  assert.ok(Array.isArray(allMarkets), 'Markets must be an array');
  assert.ok(allMarkets.length >= 5, 'Should return multiple markets');
  console.log('  ✅ [PASS] Market listing returns all available markets');

  // 2. Filter markets by district
  const suratMarkets = await marketService.getAllMarkets({ district: 'Surat' });
  assert.ok(suratMarkets.length >= 1, 'Should find Surat market');
  assert.strictEqual(suratMarkets[0].district, 'Surat');
  console.log('  ✅ [PASS] Market filtering by district works');

  // 3. Get crops
  const crops = await marketService.getCrops();
  assert.ok(Array.isArray(crops));
  assert.ok(crops.some(c => c.name === 'Tomato'));
  assert.ok(crops.some(c => c.name_mr === 'टोमॅटो'));
  console.log('  ✅ [PASS] Crops listing contains multilingual names (en, gu, hi, mr)');

  // 4. Get market prices for Tomato
  const tomatoPrices = await marketService.getMarketPrices({ crop: 'Tomato' });
  assert.ok(tomatoPrices.length >= 3, 'Should have multiple tomato mandi rates');
  assert.ok(tomatoPrices.every(p => p.crop_name === 'Tomato'));
  assert.ok(tomatoPrices.every(p => p.dataStatus === 'DEMO'));
  console.log('  ✅ [PASS] Market prices filter by crop name');

  // 5. Filter prices by district
  const suratPrices = await marketService.getMarketPrices({ district: 'Surat' });
  assert.ok(suratPrices.length >= 1);
  assert.ok(suratPrices.every(p => p.district === 'Surat'));
  console.log('  ✅ [PASS] Market prices filter by district');

  // 6. Empty search result handling
  const noPrices = await marketService.getMarketPrices({ crop: 'ExoticNonExistentCrop123' });
  assert.strictEqual(noPrices.length, 0, 'Should return empty array for non-existent crop');
  console.log('  ✅ [PASS] Empty market search handled gracefully without errors');

  // 7. Market price comparison
  const comparison = await marketService.compareMarkets({ crop: 'Tomato' });
  assert.strictEqual(comparison.crop, 'Tomato');
  assert.ok(comparison.totalMarkets >= 2);
  assert.ok(comparison.highestMarket.pricePerKg >= comparison.lowestMarket.pricePerKg);
  assert.strictEqual(typeof comparison.priceDifferencePerKg, 'number');
  console.log('  ✅ [PASS] Market price comparison calculates factual price spreads');

  // 8. Price trends
  const trends = await marketService.getPriceTrends({ crop: 'Tomato', days: 7 });
  assert.strictEqual(trends.length, 7, 'Should return 7 trend points');
  assert.ok(trends[0].pricePerKg > 0);
  console.log('  ✅ [PASS] Price trends generation returns historical chart points');

  console.log('\n======================================================');
  console.log('🎉 All Market Service Tests Passed Successfully!');
  console.log('======================================================\n');
}

if (require.main === module) {
  runMarketTests().catch(err => {
    console.error('Test failure:', err);
    process.exit(1);
  });
}

module.exports = { runMarketTests };
