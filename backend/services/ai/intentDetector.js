/**
 * intentDetector.js
 * Mitra Assistant - Lightweight Deterministic Intent & Language Detector
 * HarvestMitra AI - ISSUE-09
 */

const INTENT_PATTERNS = {
  market_price: [
    // English
    /\b(price|rate|mandi|market|bhav|cost per kg|how much is|rate of)\b/i,
    // Hindi
    /(भाव|दाम|रेट|मंडी|कीमत|दर|बाज़ार भाव)/i,
    // Gujarati
    /(ભાવ|દર|બજાર ભાવ|મંડી ભાવ|કીમત|કિંમત)/i,
    // Marathi
    /(भाव|दर|बाजार भाव|मंडी भाव|किंमत|दर काय आहे)/i
  ],

  harvest_decision: [
    // English
    /\b(harvest|sell|hold|store|wait|when to sell|should i sell|sell today|sell later)\b/i,
    // Hindi
    /(काटना|काटूं|बेचना|बेचूं|रखूं|इंतजार|कब बेचूं|आज बेचूं|फसल बेचूं)/i,
    // Gujarati
    /(કાપણી|વેચવું|વેચું|રાખવું|રાખું|ક્યારે વેચવું|આજે વેચવું|ખોટ|નફો થશે)/i,
    // Marathi
    /(कापणी|काढणी|विकू|विकायचे|विकावे|ठेवू|साठवण|कधी विकावे|आज विकावे|फायदा होईल)/i
  ],

  revenue_calculation: [
    // English
    /\b(revenue|profit|income|net revenue|gross revenue|calculate|calculation|earning|expenses|total cost)\b/i,
    // Hindi
    /(कमाई|मुनाफा|लाभ|शुद्ध कमाई|कुल कमाई|खर्च|लागत|हिसाब|गणना)/i,
    // Gujarati
    /(ચોખ્ખો નફો|કુલ આવક|નફો|ખર્ચ|ગણતરી|હિસાબ|આવક)/i,
    // Marathi
    /(नफा|कमाई|उत्पन्न|निव्वळ नफा|खर्च|लागत|हिशोब|हिशेब|गणना)/i
  ],

  transport: [
    // English
    /\b(transport|vehicle|truck|tempo|pool|share transport|logistics|freight|delivery)\b/i,
    // Hindi
    /(परिवहन|गाड़ी|ट्रक|टेंपो|भाड़ा|साझा परिवहन|किराया|सवारी)/i,
    // Gujarati
    /(વાહન|ગાડી|ટ્રક|ટેમ્પો|ભાડું|સહિયારું વાહન|ટ્રાન્સપોર્ટ)/i,
    // Marathi
    /(वाहतूक|गाडी|ट्रक|टेम्पो|भाडे|सामायिक वाहतूक|लॉजिस्टिक्स)/i
  ],

  weather: [
    // English
    /\b(weather|rain|forecast|monsoon|storm|temperature|humidity|climate)\b/i,
    // Hindi
    /(मौसम|बारिश|वर्षा|तूफान|तापमान|पूर्वानुमान)/i,
    // Gujarati
    /(હવામાન|વરસાદ|વાતાવરણ|તાપમાન|આગાહી)/i,
    // Marathi
    /(हवामान|पाऊस|तापमान|अंदाज|वादळ)/i
  ],

  profile: [
    // English
    /\b(profile|my farm|my account|details|farmer profile)\b/i,
    // Hindi
    /(प्रोफाइल|मेरा खेत|खाता|मेरी जानकारी)/i,
    // Gujarati
    /(પ્રોફાઇલ|પ્રોફાઈલ|મારું ખેતર|ખાતું|મારી વિગત)/i,
    // Marathi
    /(प्रोफाइल|माझे शेत|माझे खाते|माझी माहिती)/i
  ],

  help: [
    // English
    /\b(help|support|guide|features|what can you do|how to use|mitra)\b/i,
    // Hindi
    /(मदद|सहायता|मार्गदर्शन|क्या कर सकते हो|कैसे उपयोग करें)/i,
    // Gujarati
    /(મદદ|સહાય|માર્ગદર્શન|શું કરી શકો|કેવી રીતે વાપરવું)/i,
    // Marathi
    /(मदत|मार्गदर्शन|काय करू शकता|कसे वापरावे|सहाय्य)/i
  ]
};

/**
 * Detect script / language of input text
 * @param {string} text
 * @param {string} [fallbackLang='en']
 * @returns {'en'|'hi'|'gu'}
 */
function detectLanguage(text, fallbackLang = 'en') {
  if (!text || typeof text !== 'string') {
    return normalizeLanguage(fallbackLang);
  }

  const normalizedFallback = normalizeLanguage(fallbackLang);

  // Gujarati unicode range: U+0A80 to U+0AFF
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return 'gu';
  }

  // Devanagari range: U+0900 to U+097F (used by Marathi and Hindi)
  if (/[\u0900-\u097F]/.test(text)) {
    // If fallback is Marathi or text contains distinct Marathi vocabulary
    if (
      normalizedFallback === 'mr' ||
      /(आहेत|आहे|नाही|करावे|विकावे|विकू|टोमॅटो|माझ्याकडे|बाजार|सांगा|कधी|किती|शेतकरी|पाहिजे|हिशोब|हिशेब)/i.test(text)
    ) {
      return 'mr';
    }
    return 'hi';
  }

  return normalizedFallback;
}

/**
 * Normalize language code to standard 'en' | 'hi' | 'gu'
 * @param {string} lang
 * @returns {'en'|'hi'|'gu'}
 */
function normalizeLanguage(lang) {
  if (!lang) return 'en';
  const clean = String(lang).trim().toLowerCase();
  if (clean.startsWith('gu')) return 'gu';
  if (clean.startsWith('mr')) return 'mr';
  if (clean.startsWith('hi')) return 'hi';
  return 'en';
}

/**
 * Detect user intent based on deterministic keyword matching
 * @param {string} message
 * @returns {string} One of supported intents
 */
function detectIntent(message) {
  if (!message || typeof message !== 'string') {
    return 'unknown';
  }

  const cleanMessage = message.trim();

  for (const [intent, regexList] of Object.entries(INTENT_PATTERNS)) {
    for (const regex of regexList) {
      if (regex.test(cleanMessage)) {
        return intent;
      }
    }
  }

  return 'unknown';
}

/**
 * Extract crop mentions if present in query
 * @param {string} text
 * @returns {string|null}
 */
function extractCropMention(text) {
  if (!text) return null;
  const crops = [
    { name: 'Tomato', patterns: [/\b(tomato|tomatoes)\b/i, /ટામેટાં?/i, /टमाटर/i, /टोमॅटो/i, /टोमेटो/i] },
    { name: 'Onion', patterns: [/\b(onion|onions)\b/i, /ડુંગળી/i, /प्याज/i, /कांदा/i] },
    { name: 'Wheat', patterns: [/\b(wheat)\b/i, /ઘઉં/i, /गेहूं/i, /गहू/i] },
    { name: 'Soybean', patterns: [/\b(soybean|soya)\b/i, /સોયાબીન/i, /सोयाबीन/i] },
    { name: 'Cotton', patterns: [/\b(cotton)\b/i, /કપાસ/i, /कपास/i, /कापूस/i] }
  ];

  for (const crop of crops) {
    for (const pattern of crop.patterns) {
      if (pattern.test(text)) return crop.name;
    }
  }
  return null;
}

/**
 * Extract numerical quantity (kg/quintal) if present
 * @param {string} text
 * @returns {{ quantityKg: number | null, unit: string | null }}
 */
function extractQuantity(text) {
  if (!text) return { quantityKg: null, unit: null };

  // Match e.g. "500 kg", "500kg", "500 કિલો", "500 किलो", "5 quintal"
  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|કિલો|किलो)/i);
  if (kgMatch) {
    return { quantityKg: parseFloat(kgMatch[1]), unit: 'kg' };
  }

  const quintalMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:quintal|કવિન્ટલ|क्विंटल)/i);
  if (quintalMatch) {
    return { quantityKg: parseFloat(quintalMatch[1]) * 100, unit: 'quintal' };
  }

  // Bare number match if preceded or followed by quantity keywords
  const genericMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (genericMatch) {
    return { quantityKg: parseFloat(genericMatch[1]), unit: 'kg' };
  }

  return { quantityKg: null, unit: null };
}

module.exports = {
  detectIntent,
  detectLanguage,
  normalizeLanguage,
  extractCropMention,
  extractQuantity,
  INTENT_PATTERNS
};
