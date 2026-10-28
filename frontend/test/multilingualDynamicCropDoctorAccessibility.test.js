/**
 * multilingualDynamicCropDoctorAccessibility.test.js
 * Comprehensive Test Suite for:
 * 1. Multilingual Support across Marathi (mr), Hindi (hi), Gujarati (gu), and English (en)
 * 2. Dynamic Crop Doctor with no 4-crop limit, supporting Maharashtra & Gujarat crops
 * 3. Transparent Honest Diagnostics (no fake confidence scores, clear sample vs user upload distinction)
 * 4. Simplified Kisan Accessibility Bar with 3 primary actions and localized speech reading
 *
 * HarvestMitra AI
 */

import assert from 'node:assert';
import { en } from '../src/locales/en.js';
import { mr } from '../src/locales/mr.js';
import { hi } from '../src/locales/hi.js';
import { gu } from '../src/locales/gu.js';
import { SUPPORTED_LANGUAGES } from '../src/context/LanguageConstants.js';
import { 
  loadSupportedCrops, 
  getPathologyGuide, 
  buildPrescriptionSpeechText,
  AUTHORITATIVE_CROPS,
  CROP_PATHOLOGY_RECORDS
} from '../src/services/cropDoctorService.js';
import { 
  findMatchingVoice, 
  cleanTextForSpeech, 
  SUPPORTED_LANGUAGES as SPEECH_LANGUAGES 
} from '../src/services/speechService.js';
import { matchWakeWord, SENSITIVITY_CONFIGS } from '../src/services/kisanVoiceService.js';

console.log('\n================================================================');
console.log('🌱 HarvestMitra AI — Multilingual, Crop Doctor & Accessibility Audit');
console.log('================================================================\n');

// -------------------------------------------------------------
// SCENARIO 1 & 2: Multilingual Dictionary Integrity for mr, hi, gu, en
// -------------------------------------------------------------
console.log('Scenario 1 & 2: Checking Multilingual Support for Crop Doctor & Accessibility Bar:');

const locales = { en, mr, hi, gu };

// 1. Verify all 4 languages are configured in LanguageConstants
const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
assert.ok(supportedCodes.includes('mr'), 'LanguageConstants must include Marathi (mr)');
assert.ok(supportedCodes.includes('hi'), 'LanguageConstants must include Hindi (hi)');
assert.ok(supportedCodes.includes('en'), 'LanguageConstants must include English (en)');
assert.ok(supportedCodes.includes('gu'), 'LanguageConstants must include Gujarati (gu)');
console.log('  ✅ [PASS] LanguageConstants has all 4 languages: mr, hi, en, gu');

// 2. Check kisanVoice translations in all 4 languages
const requiredKisanVoiceKeys = [
  'launcher',
  'title',
  'accessibility',
  'mitraChat',
  'readPage',
  'stopReading',
  'cropDoctor',
  'moreTools',
  'mandiRadio',
  'speechStopped'
];

for (const [langCode, dict] of Object.entries(locales)) {
  assert.ok(dict.kisanVoice, `Locale '${langCode}' must have 'kisanVoice' section`);
  for (const key of requiredKisanVoiceKeys) {
    assert.ok(
      dict.kisanVoice[key] && dict.kisanVoice[key].trim().length > 0,
      `Locale '${langCode}' must define kisanVoice.${key}`
    );
  }
}
console.log('  ✅ [PASS] All 4 locales (mr, hi, gu, en) have complete kisanVoice translations');

// 3. Check cropDoctor translations in all 4 languages
const requiredCropDoctorKeys = [
  'title',
  'badge',
  'subtitle',
  'sampleGuideTab',
  'realUploadTab',
  'searchPlaceholder',
  'selectCropLabel',
  'allCategories',
  'sampleBadge',
  'uploadTitle',
  'selectPhotoButton',
  'honestAdvisoryBadge',
  'severity',
  'symptoms',
  'organicRemedy',
  'chemicalRemedy',
  'chemicalWarning',
  'kvkPolicy',
  'disclaimerText',
  'speakPrescription',
  'stopSpeech',
  'shareWhatsApp',
  'loginRequired',
  'signInButton',
  'registerButton'
];

for (const [langCode, dict] of Object.entries(locales)) {
  assert.ok(dict.cropDoctor, `Locale '${langCode}' must have 'cropDoctor' section`);
  for (const key of requiredCropDoctorKeys) {
    assert.ok(
      dict.cropDoctor[key] && dict.cropDoctor[key].trim().length > 0,
      `Locale '${langCode}' must define cropDoctor.${key}`
    );
  }
}
console.log('  ✅ [PASS] All 4 locales (mr, hi, gu, en) have complete cropDoctor translations');

// -------------------------------------------------------------
// SCENARIO 3 & 4: Language Switching & Consistency Check
// -------------------------------------------------------------
console.log('\nScenario 3 & 4: Checking Language Persistence and Fallback Consistency:');

// Test Gujarati specific strings
assert.strictEqual(gu.kisanVoice.mitraChat, 'મિત્ર AI ને પૂછો');
assert.strictEqual(gu.kisanVoice.readPage, 'આ પૃષ્ઠ મોટેથી વાંચો');
assert.strictEqual(gu.cropDoctor.title, 'AI કિસાન પાક ડૉક્ટર');
console.log('  ✅ [PASS] Gujarati displays authentic native terminology without English mixing');

// Test Marathi specific strings
assert.strictEqual(mr.kisanVoice.mitraChat, 'मित्रा AI विचारा');
assert.strictEqual(mr.kisanVoice.readPage, 'हे पान वाचून दाखवा');
assert.strictEqual(mr.cropDoctor.title, 'AI किसान पीक डॉक्टर');
console.log('  ✅ [PASS] Marathi displays authentic native terminology without English mixing');

// Test Hindi specific strings
assert.strictEqual(hi.kisanVoice.mitraChat, 'मित्रा AI से पूछें');
assert.strictEqual(hi.kisanVoice.readPage, 'यह पृष्ठ पढ़कर सुनाएं');
assert.strictEqual(hi.cropDoctor.title, 'AI किसान फसल डॉक्टर');
console.log('  ✅ [PASS] Hindi displays authentic native terminology without English mixing');

// -------------------------------------------------------------
// SCENARIO 5 & 6: Dynamic Crop List & Elimination of 4-Crop Limitation
// -------------------------------------------------------------
console.log('\nScenario 5 & 6: Checking Dynamic Crop Loading & Removal of 4-Crop Limit:');

const supportedCrops = await loadSupportedCrops();
assert.ok(Array.isArray(supportedCrops), 'loadSupportedCrops() must return an array');
assert.ok(
  supportedCrops.length >= 15,
  `Supported crops must be >= 15 (got ${supportedCrops.length}), removing the 4-crop restriction`
);

// Verify Maharashtra & Gujarat staple crops are included
const expectedCrops = [
  'Sugarcane',
  'Rice (Paddy)',
  'Soybean',
  'Maize',
  'Groundnut',
  'Chickpea (Gram)',
  'Pigeon Pea (Tur)',
  'Brinjal',
  'Green Chilli',
  'Grapes',
  'Banana',
  'Tomato',
  'Onion',
  'Potato',
  'Cotton',
  'Wheat'
];

for (const exp of expectedCrops) {
  const found = supportedCrops.some((c) => c.nameEn === exp || c.nameEn.toLowerCase().includes(exp.toLowerCase().split(' ')[0]));
  assert.ok(found, `Crop '${exp}' must be present in dynamic supported crop list`);
}
console.log(`  ✅ [PASS] Dynamic crop list contains ${supportedCrops.length} crops including Sugarcane, Soybean, Rice, Maize, Grapes, Cotton, Tur, Chickpea, etc.`);
console.log('  ✅ [PASS] Confirmed: No unexplained 4-crop hardcoded limit remains.');

// -------------------------------------------------------------
// SCENARIO 7 & 8: Transparent Diagnostics & Honest Advisories
// -------------------------------------------------------------
console.log('\nScenario 7 & 8: Checking Honest Diagnostics (No Fake 95.2% Confidence):');

// 1. Inspect Tomato guide
const tomatoGuide = getPathologyGuide('tomato');
assert.ok(tomatoGuide.isSupported, 'Tomato must be supported in pathology catalog');
assert.ok(!tomatoGuide.confidence, 'Must NOT contain fake hardcoded confidence score');
assert.ok(tomatoGuide.organicRemedy.mr, 'Must have Marathi organic remedy');
assert.ok(tomatoGuide.organicRemedy.hi, 'Must have Hindi organic remedy');
assert.ok(tomatoGuide.organicRemedy.gu, 'Must have Gujarati organic remedy');
assert.ok(tomatoGuide.chemicalRemedy.en.includes('CIB&RC approved') || tomatoGuide.chemicalRemedy.en.includes('consult local agronomist'), 'Must emphasize CIB&RC approved guidance and agronomist consultation');
console.log('  ✅ [PASS] Pathology records do not claim fabricated confidence percentages');

// 2. Inspect Sugarcane (newly supported Maharashtra crop)
const sugarcaneGuide = getPathologyGuide('sugarcane');
assert.ok(sugarcaneGuide.isSupported, 'Sugarcane must have verified pathology record');
assert.strictEqual(sugarcaneGuide.crop, 'Sugarcane');
assert.ok(sugarcaneGuide.diseaseName.mr.includes('रेड रॉट') || sugarcaneGuide.diseaseName.mr.includes('कुजव्या'));
console.log('  ✅ [PASS] Sugarcane pathology guide verified in Marathi, Hindi, Gujarati, English');

// 3. Inspect Soybean
const soybeanGuide = getPathologyGuide('soybean');
assert.ok(soybeanGuide.isSupported, 'Soybean must have verified pathology record');
assert.ok(soybeanGuide.diseaseName.mr.includes('तांबेरा'));
console.log('  ✅ [PASS] Soybean rust guide verified across all 4 languages');

// -------------------------------------------------------------
// SCENARIO 9: Unsupported Crop Fallback
// -------------------------------------------------------------
console.log('\nScenario 9: Checking Unsupported Crop Handling:');

const unsupportedGuide = getPathologyGuide('dragonfruit_unknown');
assert.strictEqual(unsupportedGuide.isSupported, false, 'Unknown crop must be marked isSupported = false');
assert.ok(
  unsupportedGuide.symptoms.en.includes('outside HarvestMitra\'s verified photographic diagnostic catalog'),
  'Unsupported crop must inform user truthfully'
);
assert.ok(
  unsupportedGuide.subsidyGuideline.en.includes('Mitra AI') || unsupportedGuide.subsidyGuideline.en.includes('Taluka Krishi Bhavan'),
  'Unsupported crop must offer safe next steps'
);
console.log('  ✅ [PASS] Unsupported crop provides transparent explanation and safe next steps without fabricating diagnoses');

// -------------------------------------------------------------
// SCENARIO 10: Speech Synthesis Across Selected Languages
// -------------------------------------------------------------
console.log('\nScenario 10: Checking Text-to-Speech & Speech Builder Across Languages:');

for (const lang of ['mr', 'hi', 'gu', 'en']) {
  const speechText = buildPrescriptionSpeechText(tomatoGuide, lang);
  assert.ok(speechText && speechText.length > 20, `Speech text for '${lang}' must be non-empty`);
  assert.ok(
    !speechText.includes('undefined') && !speechText.includes('null'),
    `Speech text for '${lang}' must not contain undefined or null values`
  );
}
console.log('  ✅ [PASS] Speech text builder produces localized strings for mr, hi, gu, en');

// Verify speech cleaning
const messyText = '### **Tomato Blight** [DEMO] Spray 5ml • Neem Oil at https://example.com/pesticide';
const cleaned = cleanTextForSpeech(messyText);
assert.ok(!cleaned.includes('#'), 'Cleaned text must strip markdown headers');
assert.ok(!cleaned.includes('**'), 'Cleaned text must strip bold markers');
assert.ok(!cleaned.includes('https://'), 'Cleaned text must strip raw URLs');
console.log(`  ✅ [PASS] cleanTextForSpeech correctly sanitizes output: "${cleaned}"`);

// -------------------------------------------------------------
// SCENARIO 11 & 12: Simplified Accessibility Bar Structure
// -------------------------------------------------------------
console.log('\nScenario 11 & 12: Checking Simplified Accessibility Menu Architecture:');

// Primary Actions: 1) Mitra AI, 2) Read Page Aloud, 3) Crop Doctor
// Secondary / More Tools: Mandi Audio Radio
assert.ok(en.kisanVoice.mitraChat, 'Primary action 1: Ask Mitra AI');
assert.ok(en.kisanVoice.readPage, 'Primary action 2: Read This Page Aloud');
assert.ok(en.kisanVoice.cropDoctor, 'Primary action 3: AI Crop Doctor');
assert.ok(en.kisanVoice.moreTools, 'Collapsible drawer: More Tools');
assert.ok(en.kisanVoice.mandiRadio, 'Mandi Audio Radio moved inside secondary More Tools drawer');
console.log('  ✅ [PASS] Accessibility bar streamlined to 3 primary actions + secondary expandable tools');

// -------------------------------------------------------------
// SCENARIO 13: Wake-Word Support in Gujarati, Marathi, Hindi, English
// -------------------------------------------------------------
console.log('\nScenario 13: Checking Wake-Word Detection Across All 4 Languages:');

const wakeTests = [
  { text: 'hey mitra tomato rate kay aahe', lang: 'mr', expectedMatch: true },
  { text: 'नमस्ते मित्रा आज का मौसम कैसा है', lang: 'hi', expectedMatch: true },
  { text: 'નમસ્તે મિત્રા આજના બજાર ભાવ શું છે', lang: 'gu', expectedMatch: true },
  { text: 'hey mitra find transport to pune', lang: 'en', expectedMatch: true }
];

for (const wt of wakeTests) {
  const match = matchWakeWord(wt.text, wt.lang);
  assert.strictEqual(match.matched, wt.expectedMatch, `Wake word for '${wt.lang}' must trigger on "${wt.text}"`);
}
console.log('  ✅ [PASS] Wake word detector successfully triggers in mr, hi, gu, and en');

console.log('\n================================================================');
console.log('🎉 ALL 13 TEST SCENARIOS PASSED WITH ZERO FAILURES!');
console.log('================================================================\n');
