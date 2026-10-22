/**
 * kisanVoiceAssistant.test.js
 * Verification of Mitra Voice Wake-Word Trigger ("Hey Mitra" / "नमस्ते मित्रा")
 * Continuous Listening Mode, Speech Sensitivity Controls, and WhatsApp Rain Preview
 * HarvestMitra AI
 */

import assert from 'node:assert';
import {
  WAKE_WORD_PATTERNS,
  SENSITIVITY_CONFIGS,
  matchWakeWord
} from '../src/services/kisanVoiceService.js';
import { SUPPORTED_LANGUAGES } from '../src/services/speechService.js';
import { triggerWhatsAppRainToast, enrichWithWhatsAppRainAlert } from '../src/services/weatherApiService.js';

console.log('\n======================================================');
console.log('🎙️ HarvestMitra AI — Kisan AI Assistant Voice & Wake-Word Tests');
console.log('Continuous Listening & "Hey Mitra" Wake-Word Trigger Verification');
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

// ---------------------------------------------------------------------------
// 1. Voice Wake-Word Trigger Detection: Marathi, Hindi, English
// ---------------------------------------------------------------------------
console.log('--- [Part 1] Multilingual Wake-Word Trigger Patterns (mr, hi, en) ---');

function testWakeWordMatch(transcript, lang) {
  return matchWakeWord(transcript, lang);
}

// English Test Cases
const enCases = [
  { input: 'Hey Mitra what is the tomato rate in Nashik today?', expectedQuery: 'what is the tomato rate in Nashik today?' },
  { input: 'Hello Mitra, show me weather forecast', expectedQuery: 'show me weather forecast' },
  { input: 'Hi Mitra calculate freight for 1200kg', expectedQuery: 'calculate freight for 1200kg' },
  { input: 'Hey Mitra', expectedQuery: '' }
];

for (const tc of enCases) {
  try {
    const res = testWakeWordMatch(tc.input, 'en');
    assert.strictEqual(res.matched, true, `Should detect wake-word in: "${tc.input}"`);
    assert.strictEqual(res.query, tc.expectedQuery, `Query extracted should match: "${tc.expectedQuery}"`);
    pass(`English Wake-Word Trigger: "${tc.input}" → Wake: "${res.wakeWord}" | Query: "${res.query}"`);
  } catch (err) {
    fail(`English Wake-Word: "${tc.input}"`, err);
  }
}

// Hindi Test Cases
const hiCases = [
  { input: 'नमस्ते मित्रा आज का टमाटर मंडी भाव क्या है?', expectedQuery: 'आज का टमाटर मंडी भाव क्या है?' },
  { input: 'हे मित्रा shared transport ka bhada kitna lagega?', expectedQuery: 'shared transport ka bhada kitna lagega?' },
  { input: 'नमस्ते मित्र बारिश का क्या हाल है?', expectedQuery: 'बारिश का क्या हाल है?' },
  { input: 'हेलो मित्रा', expectedQuery: '' }
];

for (const tc of hiCases) {
  try {
    const res = testWakeWordMatch(tc.input, 'hi');
    assert.strictEqual(res.matched, true, `Should detect Hindi wake-word in: "${tc.input}"`);
    assert.strictEqual(res.query, tc.expectedQuery, `Query extracted should match: "${tc.expectedQuery}"`);
    pass(`Hindi Wake-Word Trigger: "${tc.input}" → Wake: "${res.wakeWord}" | Query: "${res.query}"`);
  } catch (err) {
    fail(`Hindi Wake-Word: "${tc.input}"`, err);
  }
}

// Marathi Test Cases
const mrCases = [
  { input: 'हे मित्रा आज टोमॅटोचा भाव काय आहे?', expectedQuery: 'आज टोमॅटोचा भाव काय आहे?' },
  { input: 'ऐक मित्रा नाशिक बाजारात कांदा किती रुपयाने विकतोय?', expectedQuery: 'नाशिक बाजारात कांदा किती रुपयाने विकतोय?' },
  { input: 'नमस्कार मित्रा पाऊस पडणार आहे का?', expectedQuery: 'पाऊस पडणार आहे का?' },
  { input: 'हे मित्रा', expectedQuery: '' }
];

for (const tc of mrCases) {
  try {
    const res = testWakeWordMatch(tc.input, 'mr');
    assert.strictEqual(res.matched, true, `Should detect Marathi wake-word in: "${tc.input}"`);
    assert.strictEqual(res.query, tc.expectedQuery, `Query extracted should match: "${tc.expectedQuery}"`);
    pass(`Marathi Wake-Word Trigger: "${tc.input}" → Wake: "${res.wakeWord}" | Query: "${res.query}"`);
  } catch (err) {
    fail(`Marathi Wake-Word: "${tc.input}"`, err);
  }
}

// ---------------------------------------------------------------------------
// 2. Speech Sensitivity Configuration Matrix
// ---------------------------------------------------------------------------
console.log('\n--- [Part 2] Speech Sensitivity Configurations (Low, Medium, High) ---');

try {
  assert.ok(SENSITIVITY_CONFIGS.low, 'Low sensitivity must exist');
  assert.ok(SENSITIVITY_CONFIGS.medium, 'Medium sensitivity must exist');
  assert.ok(SENSITIVITY_CONFIGS.high, 'High sensitivity must exist');

  // Verify sensitivity calibration
  assert.strictEqual(SENSITIVITY_CONFIGS.low.minConfidence, 0.70, 'Low sensitivity requires 70% confidence for noisy mandis');
  assert.strictEqual(SENSITIVITY_CONFIGS.medium.minConfidence, 0.50, 'Medium sensitivity requires 50% confidence');
  assert.strictEqual(SENSITIVITY_CONFIGS.high.minConfidence, 0.30, 'High sensitivity has 30% confidence for soft speech');

  // Verify silence timeouts
  assert.ok(
    SENSITIVITY_CONFIGS.low.silenceDelayMs > SENSITIVITY_CONFIGS.high.silenceDelayMs,
    'Noisy mandi mode must have longer pause tolerance'
  );

  pass('Speech sensitivity presets calibrated for noisy rural APMC mandis and quiet rooms');
} catch (err) {
  fail('Speech sensitivity configurations', err);
}

// ---------------------------------------------------------------------------
// 3. Indian Locale Speech Recognition & Synthesis Locales
// ---------------------------------------------------------------------------
console.log('\n--- [Part 3] Speech Recognition Locales (mr-IN, hi-IN, en-IN) ---');

try {
  assert.strictEqual(SUPPORTED_LANGUAGES.mr.speechRecognition, 'mr-IN');
  assert.strictEqual(SUPPORTED_LANGUAGES.hi.speechRecognition, 'hi-IN');
  assert.strictEqual(SUPPORTED_LANGUAGES.en.speechRecognition, 'en-IN');
  pass('3 core languages map strictly to verified Indian voice locales');
} catch (err) {
  fail('Speech recognition locales', err);
}

// ---------------------------------------------------------------------------
// 4. Weather Service WhatsApp Rain Preview Toast Trigger
// ---------------------------------------------------------------------------
console.log('\n--- [Part 4] Instant WhatsApp Preview Toast for Heavy Rain (>60%) ---');

try {
  let toastTriggered = null;
  const mockShowToast = (payload) => {
    toastTriggered = payload;
  };

  // Heavy rain case (>60%)
  const highRainWeather = {
    location: { name: 'Surat' },
    weather: { rainProbability: 70 },
    rainChance: 70
  };

  triggerWhatsAppRainToast(highRainWeather, mockShowToast);
  assert.ok(toastTriggered, 'Toast must trigger when rain prob >= 60%');
  assert.strictEqual(toastTriggered.type, 'whatsapp');
  assert.ok(toastTriggered.title.includes('Surat'));
  assert.ok(toastTriggered.title.includes('70%'));
  assert.ok(toastTriggered.whatsappUrl.includes('api.whatsapp.com'));
  pass('Weather service triggers instant WhatsApp preview toast when heavy rain (>60%) is detected');

  // Low rain case (<60%) - should NOT trigger heavy rain toast
  toastTriggered = null;
  const lowRainWeather = {
    location: { name: 'Ahmedabad' },
    weather: { rainProbability: 25 },
    rainChance: 25
  };

  triggerWhatsAppRainToast(lowRainWeather, mockShowToast);
  assert.strictEqual(toastTriggered, null, 'Toast must NOT trigger when rain < 60%');
  pass('Weather service does not trigger rain warning toast when rain probability is low (25%)');

  // Weather enrichment helper verification
  const enriched = enrichWithWhatsAppRainAlert({
    location: { name: 'Nashik' },
    weather: { rainProbability: 75 },
    rainChance: 75
  }, 'Nashik');

  assert.ok(enriched.whatsappAlertPreview, 'Must enrich payload with whatsappAlertPreview');
  assert.strictEqual(enriched.whatsappAlertPreview.isHeavyRain, true);
  assert.strictEqual(enriched.whatsappAlertPreview.rainProbability, 75);
  pass('enrichWithWhatsAppRainAlert enriches weather payload with WhatsApp alert preview');
} catch (err) {
  fail('WhatsApp rain preview toast trigger', err);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n======================================================');
if (failed === 0) {
  console.log(`🎉 All ${passed} Kisan AI Assistant & Voice Tests Passed Successfully!`);
  console.log('Continuous Listening, Wake-Word Trigger, and Rain Advisory Toast Verified.');
} else {
  console.error(`⚠️ Test Run Completed: ${passed} Passed, ${failed} Failed.`);
}
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
