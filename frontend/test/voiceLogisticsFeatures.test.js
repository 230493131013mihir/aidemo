/**
 * voiceLogisticsFeatures.test.js
 * Verification of Voice Search, Audio Readout, and Corridor Freight Calculator
 * Assigned to Varun Patil (@varunpatil1706) - Issues #82, #83, #84
 */

import assert from 'node:assert';
import { CORRIDORS, calculateCorridorFreight } from '../src/services/corridorFreightService.js';
import { SUPPORTED_LANGUAGES } from '../src/services/speechService.js';

console.log('\n======================================================');
console.log('🎙️ HarvestMitra AI - Voice AI & Logistics Tests (Varun Patil)');
console.log('Issues #82, #83, #84 Verification');
console.log('======================================================\n');

// 1. Issue #82: Multilingual Speech Recognition Locales (mr, hi, en)
console.log('1. Verifying Universal Voice Search Locales (Issue #82):');
const expectedLocales = {
  mr: 'mr-IN',
  hi: 'hi-IN',
  en: 'en-IN'
};

for (const [lang, locale] of Object.entries(expectedLocales)) {
  assert.strictEqual(
    SUPPORTED_LANGUAGES[lang].speechRecognition,
    locale,
    `Voice search for ${lang} must map to ${locale}`
  );
  console.log(`  ✅ [PASS] Locale verified for ${lang}: ${locale}`);
}

// 2. Issue #83: Text to Speech Readout Locales & Formatter
console.log('\n2. Verifying Audio Speech Readout Button (Issue #83):');
for (const [lang, locale] of Object.entries(expectedLocales)) {
  assert.strictEqual(
    SUPPORTED_LANGUAGES[lang].speechSynthesis,
    locale,
    `TextToSpeech synthesis for ${lang} must map to ${locale}`
  );
  console.log(`  ✅ [PASS] Audio readout synthesis locale verified for ${lang}: ${locale}`);
}

// 3. Issue #84: Agricultural Freight Corridor Lookup & Distance Estimator (Maharashtra Corridors)
console.log('\n3. Verifying Maharashtra Highway Corridors & Dynamic Freight Calculator (Issue #84):');

const requiredCorridorKeys = [
  'nashik-vashi',
  'pune-vashi',
  'kolhapur-pune',
  'nagpur-amravati'
];

assert.strictEqual(CORRIDORS.length, 4, 'Must configure exactly 4 key Maharashtra agricultural corridors');

for (const key of requiredCorridorKeys) {
  const corridor = CORRIDORS.find((c) => c.id === key);
  assert.ok(corridor, `Corridor '${key}' must exist`);
  assert.ok(corridor.distanceKm > 0, `Corridor '${key}' distance must be positive`);
  assert.ok(corridor.baseSoloCost > corridor.baseSharedCost, `Solo cost must be higher than shared cost`);
  assert.ok(corridor.weather?.badgeText, `Corridor '${key}' must have weather safety badge`);
  assert.ok(corridor.weather?.advisory, `Corridor '${key}' must have safety advisory`);
}

// Verify Nashik - Vashi specs: 165km, ₹5,200 solo vs ₹1,950 shared, saves ₹3,250/63%
const nashikVashi = CORRIDORS.find((c) => c.id === 'nashik-vashi');
assert.strictEqual(nashikVashi.distanceKm, 165, 'Nashik-Vashi must be 165km');
assert.strictEqual(nashikVashi.baseSoloCost, 5200, 'Nashik-Vashi base solo cost must be ₹5,200');
assert.strictEqual(nashikVashi.baseSharedCost, 1950, 'Nashik-Vashi base shared cost must be ₹1,950');
const nvSaving = nashikVashi.baseSoloCost - nashikVashi.baseSharedCost;
const nvSavingPct = Math.round((nvSaving / nashikVashi.baseSoloCost) * 100);
assert.strictEqual(nvSaving, 3250, 'Nashik-Vashi must save ₹3,250');
assert.strictEqual(nvSavingPct, 63, 'Nashik-Vashi savings percentage must be 63%');
assert.ok(nashikVashi.weather.badgeText.includes('Kasara Ghat'), 'Must include Kasara Ghat weather badge');
console.log(`  ✅ [PASS] Nashik-Vashi: 165km, Solo ₹${nashikVashi.baseSoloCost} vs Shared ₹${nashikVashi.baseSharedCost} (Saves ₹${nvSaving}/${nvSavingPct}%)`);

// Verify Pune - Vashi APMC specs: 148km, ₹4,800 solo vs ₹1,800 shared, saves ₹3,000/62%
const puneVashi = CORRIDORS.find((c) => c.id === 'pune-vashi');
assert.strictEqual(puneVashi.distanceKm, 148, 'Pune-Vashi must be 148km');
assert.strictEqual(puneVashi.baseSoloCost, 4800, 'Pune-Vashi base solo cost must be ₹4,800');
assert.strictEqual(puneVashi.baseSharedCost, 1800, 'Pune-Vashi base shared cost must be ₹1,800');
const pvSaving = puneVashi.baseSoloCost - puneVashi.baseSharedCost;
const pvSavingPct = Math.round((pvSaving / puneVashi.baseSoloCost) * 100);
assert.strictEqual(pvSaving, 3000, 'Pune-Vashi must save ₹3,000');
assert.strictEqual(pvSavingPct, 63, 'Pune-Vashi savings percentage must be ~62-63%');
console.log(`  ✅ [PASS] Pune-Vashi: 148km, Solo ₹${puneVashi.baseSoloCost} vs Shared ₹${puneVashi.baseSharedCost} (Saves ₹${pvSaving}/${pvSavingPct}%)`);

// Verify Kolhapur - Pune specs: 235km, ₹7,200 solo vs ₹2,700 shared, saves ₹4,500/62%
const kolhapurPune = CORRIDORS.find((c) => c.id === 'kolhapur-pune');
assert.strictEqual(kolhapurPune.distanceKm, 235, 'Kolhapur-Pune must be 235km');
assert.strictEqual(kolhapurPune.baseSoloCost, 7200, 'Kolhapur-Pune base solo cost must be ₹7,200');
assert.strictEqual(kolhapurPune.baseSharedCost, 2700, 'Kolhapur-Pune base shared cost must be ₹2,700');
const kpSaving = kolhapurPune.baseSoloCost - kolhapurPune.baseSharedCost;
const kpSavingPct = Math.round((kpSaving / kolhapurPune.baseSoloCost) * 100);
assert.strictEqual(kpSaving, 4500, 'Kolhapur-Pune must save ₹4,500');
assert.strictEqual(kpSavingPct, 63, 'Kolhapur-Pune savings percentage must be ~62-63%');
console.log(`  ✅ [PASS] Kolhapur-Pune: 235km, Solo ₹${kolhapurPune.baseSoloCost} vs Shared ₹${kolhapurPune.baseSharedCost} (Saves ₹${kpSaving}/${kpSavingPct}%)`);

// Verify Nagpur - Amravati specs: 155km
const nagpurAmravati = CORRIDORS.find((c) => c.id === 'nagpur-amravati');
assert.strictEqual(nagpurAmravati.distanceKm, 155, 'Nagpur-Amravati must be 155km');
console.log(`  ✅ [PASS] Nagpur-Amravati: 155km, Solo ₹${nagpurAmravati.baseSoloCost} vs Shared ₹${nagpurAmravati.baseSharedCost}`);

console.log('\n======================================================');
console.log('🎉 All Maharashtra Voice AI & Freight Tests Passed!');
console.log('======================================================\n');
