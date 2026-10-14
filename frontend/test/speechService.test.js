/**
 * speechService.test.js
 * Verification of Speech Service logic, language codes, voice matching and fallbacks
 * HarvestMitra AI - ISSUE-10
 */

import assert from 'node:assert';
import {
  SUPPORTED_LANGUAGES,
  findMatchingVoice,
  cleanTextForSpeech,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported
} from '../src/services/speechService.js';

console.log('\n======================================================');
console.log('🎙️ HarvestMitra AI - ISSUE-10 Speech Service Tests');
console.log('======================================================\n');

// 1. Language Definitions Verification
console.log('1. Checking 4 Supported Languages:');
const requiredLangs = ['en', 'hi', 'gu', 'mr'];
for (const lang of requiredLangs) {
  assert.ok(SUPPORTED_LANGUAGES[lang], `Language '${lang}' must be configured`);
  assert.ok(SUPPORTED_LANGUAGES[lang].speechRecognition.endsWith('-IN'), `Recognition locale for '${lang}' must be Indian locale (-IN)`);
  assert.ok(SUPPORTED_LANGUAGES[lang].speechSynthesis.endsWith('-IN'), `Synthesis locale for '${lang}' must be Indian locale (-IN)`);
}

assert.strictEqual(SUPPORTED_LANGUAGES.mr.speechRecognition, 'mr-IN', 'Marathi recognition locale must be mr-IN');
assert.strictEqual(SUPPORTED_LANGUAGES.mr.speechSynthesis, 'mr-IN', 'Marathi synthesis locale must be mr-IN');
assert.strictEqual(SUPPORTED_LANGUAGES.gu.speechRecognition, 'gu-IN', 'Gujarati recognition locale must be gu-IN');
assert.strictEqual(SUPPORTED_LANGUAGES.hi.speechRecognition, 'hi-IN', 'Hindi recognition locale must be hi-IN');
assert.strictEqual(SUPPORTED_LANGUAGES.en.speechRecognition, 'en-IN', 'English recognition locale must be en-IN');
console.log('  ✅ [PASS] All 4 languages (en, hi, gu, mr) verified with Indian locales.');

// 2. Strict Voice Matching (NO FAKING)
console.log('\n2. Testing Voice Matching Algorithm:');
const mockVoices = [
  { name: 'Google हिन्दी', lang: 'hi-IN', default: false },
  { name: 'Google Gujarati', lang: 'gu-IN', default: false },
  { name: 'Google English (India)', lang: 'en-IN', default: true },
  { name: 'Microsoft Ravi - Marathi (India)', lang: 'mr-IN', default: false }
];

// Test Marathi voice matching
const mrMatch = findMatchingVoice('mr', mockVoices);
assert.ok(mrMatch.voice, 'Must find Marathi voice');
assert.strictEqual(mrMatch.voice.lang, 'mr-IN');
assert.strictEqual(mrMatch.exactMatch, true);
console.log('  ✅ [PASS] Marathi voice matched to mr-IN exact voice.');

// Test Gujarati voice matching
const guMatch = findMatchingVoice('gu', mockVoices);
assert.ok(guMatch.voice, 'Must find Gujarati voice');
assert.strictEqual(guMatch.voice.lang, 'gu-IN');
console.log('  ✅ [PASS] Gujarati voice matched to gu-IN.');

// Test NO FAKING: When Marathi voice is missing, must NOT return Hindi voice
const voicesWithoutMarathi = mockVoices.filter(v => v.lang !== 'mr-IN');
const noFakeMatch = findMatchingVoice('mr', voicesWithoutMarathi);
assert.strictEqual(noFakeMatch.voice, null, 'Must NOT fake voice when Marathi is unavailable');
assert.strictEqual(noFakeMatch.exactMatch, false);
console.log('  ✅ [PASS] Strictly avoids faking voice: returns null when exact/base voice is missing.');

// 3. Text Cleaner for Speech
console.log('\n3. Testing Speech Text Cleaning:');
const rawText = 'Surat APMC માં Tomato નો ભાવ ₹28/kg છે [DEMO]। **ચોખ્ખો નફો** ₹7,750 છે. [Market](http://link.com)';
const cleaned = cleanTextForSpeech(rawText);
assert.ok(!cleaned.includes('**'), 'Stripped bold markdown asterisks');
assert.ok(!cleaned.includes('http://link.com'), 'Stripped raw URL');
assert.ok(!cleaned.includes('[DEMO]'), 'Cleaned [DEMO] tag');
assert.ok(cleaned.includes('Surat APMC'), 'Preserved content');
console.log('  ✅ [PASS] Speech text cleaner prepares natural utterances.');

// 4. Browser Environment Guards
console.log('\n4. Testing Browser Environment Guards:');
// In Node.js environment without window:
assert.strictEqual(isSpeechRecognitionSupported(), false, 'Safely reports false when window is undefined');
assert.strictEqual(isSpeechSynthesisSupported(), false, 'Safely reports false when window.speechSynthesis is undefined');
console.log('  ✅ [PASS] Safe fallbacks in environments without Web Speech API.');

console.log('\n======================================================');
console.log('🎉 All Speech Service Tests Passed Successfully!');
console.log('======================================================\n');
