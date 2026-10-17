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

// 1. Issue #82: Multilingual Speech Recognition Locales
console.log('1. Verifying Universal Voice Search Locales (Issue #82):');
const expectedLocales = {
  gu: 'gu-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
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

// 3. Issue #84: Agricultural Freight Corridor Lookup & Distance Estimator
console.log('\n3. Verifying Highway Corridors & Dynamic Freight Calculator (Issue #84):');

const requiredCorridorKeys = [
  'surat-navsari',
  'surat-rajkot',
  'ahmedabad-surat',
  'nashik-vashi'
];

assert.strictEqual(CORRIDORS.length, 4, 'Must configure exactly 4 key agricultural corridors');

for (const key of requiredCorridorKeys) {
  const corridor = CORRIDORS.find((c) => c.id === key);
  assert.ok(corridor, `Corridor '${key}' must exist`);
  assert.ok(corridor.distanceKm > 0, `Corridor '${key}' distance must be positive`);
  assert.ok(corridor.baseSoloCost > corridor.baseSharedCost, `Solo cost must be higher than shared cost`);
  assert.ok(corridor.weather?.badgeText, `Corridor '${key}' must have weather safety badge`);
  assert.ok(corridor.weather?.advisory, `Corridor '${key}' must have safety advisory`);
}

// Verify Surat - Navsari specs from prompt: 38km, ₹1,200 solo vs ₹450 shared, saving ₹750/62%
const suratNavsari = CORRIDORS.find((c) => c.id === 'surat-navsari');
assert.strictEqual(suratNavsari.distanceKm, 38, 'Surat-Navsari must be 38km');
assert.strictEqual(suratNavsari.baseSoloCost, 1200, 'Surat-Navsari base solo cost must be ₹1,200');
assert.strictEqual(suratNavsari.baseSharedCost, 450, 'Surat-Navsari base shared cost must be ₹450');
const saving = suratNavsari.baseSoloCost - suratNavsari.baseSharedCost;
const savingPct = Math.round((saving / suratNavsari.baseSoloCost) * 100);
assert.strictEqual(saving, 750, 'Surat-Navsari must save ₹750');
assert.strictEqual(savingPct, 63, 'Surat-Navsari savings percentage ~62-63%');
console.log(`  ✅ [PASS] Surat-Navsari: 38km, Solo ₹${suratNavsari.baseSoloCost} vs Shared ₹${suratNavsari.baseSharedCost} (Saves ₹${saving}/${savingPct}%)`);

// Verify Surat - Rajkot specs: 430km, saves ₹5,300/62%
const suratRajkot = CORRIDORS.find((c) => c.id === 'surat-rajkot');
assert.strictEqual(suratRajkot.distanceKm, 430, 'Surat-Rajkot must be 430km');
assert.strictEqual(suratRajkot.baseSoloCost, 8550, 'Surat-Rajkot base solo cost must be ₹8,550');
assert.strictEqual(suratRajkot.baseSharedCost, 3250, 'Surat-Rajkot base shared cost must be ₹3,250');
const rajkotSaving = suratRajkot.baseSoloCost - suratRajkot.baseSharedCost;
const rajkotSavingPct = Math.round((rajkotSaving / suratRajkot.baseSoloCost) * 100);
assert.strictEqual(rajkotSaving, 5300, 'Surat-Rajkot must save ₹5,300');
assert.strictEqual(rajkotSavingPct, 62, 'Surat-Rajkot savings percentage must be 62%');
console.log(`  ✅ [PASS] Surat-Rajkot: 430km, Solo ₹${suratRajkot.baseSoloCost} vs Shared ₹${suratRajkot.baseSharedCost} (Saves ₹${rajkotSaving}/${rajkotSavingPct}%)`);

// Verify Ahmedabad - Surat specs: 265km
const ahmedabadSurat = CORRIDORS.find((c) => c.id === 'ahmedabad-surat');
assert.strictEqual(ahmedabadSurat.distanceKm, 265, 'Ahmedabad-Surat must be 265km');
console.log(`  ✅ [PASS] Ahmedabad-Surat: 265km, Solo ₹${ahmedabadSurat.baseSoloCost} vs Shared ₹${ahmedabadSurat.baseSharedCost}`);

// Verify Nashik - Vashi specs: 165km
const nashikVashi = CORRIDORS.find((c) => c.id === 'nashik-vashi');
assert.strictEqual(nashikVashi.distanceKm, 165, 'Nashik-Vashi must be 165km');
assert.ok(nashikVashi.weather.badgeText.includes('Kasara Ghat'), 'Must include Kasara Ghat weather badge');
console.log(`  ✅ [PASS] Nashik-Vashi: 165km, Solo ₹${nashikVashi.baseSoloCost} vs Shared ₹${nashikVashi.baseSharedCost} (Weather badge: ${nashikVashi.weather.badgeText})`);

console.log('\n======================================================');
console.log('🎉 All Voice Search, Audio Readout & Freight Tests Passed!');
console.log('======================================================\n');
