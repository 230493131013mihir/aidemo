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

  government_scheme: [
    // English
    /\b(scheme|schemes|subsidy|subsidies|pm-kisan|pmkisan|fasal bima|pmfby|ikhedut|khedut|kcc|kisan credit card|soil health|krishi yojana|yojana|yojna|grant|financial assistance|tractor subsidy|drip subsidy)\b/i,
    // Hindi
    /(योजना|योजनाएं|सब्सिडी|अनुदान|पीएम-किसान|पीएम किसान|फसल बीमा|सरकारी सहायता|कृषि योजना|केसीसी|ऋण|सहायता राशि|पात्रता)/i,
    // Gujarati
    /(યોજના|યોજનાઓ|સબસિડી|સહાય|આઈ-ખેડૂત|ખેડૂત સહાય|પીએમ કિસાન|પાક વીમો|ટ્રેક્ટર સબસિડી|ટપક સિંચાઈ|પાત્રતા)/i,
    // Marathi
    /(योजना|अनुदान|सबसिडी|पीएम किसान|पीएम-किसान|पीक विमा|शासकीय मदत|कृषी योजना|कर्ज माफी|ट्रॅक्टर सबसिडी|पात्रता)/i
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

  revenue_calculation: [
    // English
    /\b(revenue|profit|income|net revenue|gross revenue|calculate|calculation|earning|expenses|total cost)\b/i,
    // Hindi
    /(कमाई|मुनाफा|शुद्ध लाभ|कुल लाभ|शुद्ध कमाई|कुल कमाई|खर्च|लागत|हिसाब|गणना)/i,
    // Gujarati
    /(ચોખ્ખો નફો|કુલ આવક|નફો|ખર્ચ|ગણતરી|હિસાબ|આવક)/i,
    // Marathi
    /(नफा|कमाई|उत्पन्न|निव्वळ नफा|खर्च|लागत|हिशोब|हिशेब|गणना)/i
  ],

  weather: [
    // English & Romanized Indian / Hinglish terms
    /\b(weather|rain|raining|rainfall|forecast|monsoon|storm|temperature|humidity|climate|barish|barsat|mausam|mosam|badal|dhund|paus|havaman|tapman|varsad|vaatavaran)\b/i,
    // Hindi
    /(मौसम|बारिश|वर्षा|तूफान|तापमान|पूर्वानुमान|बादल|ओले|पाला)/i,
    // Gujarati
    /(હવામાન|વરસાદ|વાતાવરણ|તાપમાન|આગાહી|વાદળ)/i,
    // Marathi
    /(हवामान|पाऊस|तापमान|अंदाज|वादळ|ढग|गारपीट)/i
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
  if (clean.startsWith('mr') || clean.startsWith('ma') || clean === 'marathi') return 'mr';
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
    { name: 'Tomato', patterns: [/\b(tomato|tomatoes)\b/i, /ટામેટાં?/i, /टमाटर/i, /टोमॅटो/i, /टोमेटो/i, /टोमॅट/i, /टोमेट/i] },
    { name: 'Onion', patterns: [/\b(onion|onions)\b/i, /ડુંગળી/i, /प्याज/i, /कांद/i] },
    { name: 'Potato', patterns: [/\b(potato|potatoes|aloo|batata)\b/i, /બટાકા/i, /બટાટા/i, /आलू/i, /बटाट/i] },
    { name: 'Wheat', patterns: [/\b(wheat)\b/i, /ઘઉં/i, /गेहूं/i, /गहू/i, /गव्हा/i] },
    { name: 'Soybean', patterns: [/\b(soybean|soya)\b/i, /સોયાબીન/i, /सोयाबीन/i] },
    { name: 'Cotton', patterns: [/\b(cotton)\b/i, /કપાસ/i, /कपास/i, /कापूस/i] },
    { name: 'Rice', patterns: [/\b(rice|paddy)\b/i, /ડાંગર/i, /ચોખા/i, /चावल/i, /धान/i, /तांदूळ/i, /भात/i] },
    { name: 'Garlic', patterns: [/\b(garlic)\b/i, /લસણ/i, /लहसुन/i, /लसूण/i] },
    { name: 'Ginger', patterns: [/\b(ginger)\b/i, /આદુ/i, /अदरक/i, /आले/i] },
    { name: 'Chilli', patterns: [/\b(chilli|chili|mirchi)\b/i, /મરચાં?/i, /मिर्च/i, /मिरची/i] },
    { name: 'Pomegranate', patterns: [/\b(pomegranate)\b/i, /દાડમ/i, /अनार/i, /डाळिंब/i] },
    { name: 'Grapes', patterns: [/\b(grapes)\b/i, /દ્રાક્ષ/i, /अंगूर/i, /द्राक्षे/i] },
    { name: 'Sugarcane', patterns: [/\b(sugarcane)\b/i, /શેરડી/i, /गन्ना/i, /ऊस/i] },
    { name: 'Maize', patterns: [/\b(maize|corn)\b/i, /મકાઈ/i, /મક્કા/i, /मका/i] },
    { name: 'Lady Finger', patterns: [/\b(lady\s*finger|ladyfinger|okra|bhindi|bhendi)\b/i, /ભીંડો/i, /ભીંડા/i, /भिंडी/i, /भेंडी/i] },
    { name: 'Brinjal', patterns: [/\b(brinjal|eggplant|baingan|vangi)\b/i, /રીંગણ/i, /बैंगन/i, /वांगी/i] },
    { name: 'Cauliflower', patterns: [/\b(cauliflower|gobhi|phool\s*gobhi)\b/i, /ફૂલકોબી/i, /फूलगोभी/i, /फ्लॉवर/i] },
    { name: 'Cabbage', patterns: [/\b(cabbage|patta\s*gobhi|kobi)\b/i, /કોબી/i, /पत्ता\s*गोभी/i, /कोबी/i] },
    { name: 'Groundnut', patterns: [/\b(groundnut|peanut|shengdana|mungfali)\b/i, /મગફળી/i, /मूंगफली/i, /शेंगदाणा/i] }
  ];

  for (const crop of crops) {
    for (const pattern of crop.patterns) {
      if (pattern.test(text)) return crop.name;
    }
  }

  // Dynamic fallback for queries asking for "rate of <crop>" or "price of <crop>"
  const priceOfMatch = text.match(/\b(?:rate|price|cost|bhav|market\s*rate)\s+of\s+([a-zA-Z\s]+?)(?:\s+in|\s+at|\s+today|\s+near|\?|$)/i);
  if (priceOfMatch && priceOfMatch[1]) {
    const candidate = priceOfMatch[1].trim();
    if (
      candidate.length >= 3 &&
      candidate.length <= 25 &&
      !/\b(today|tomorrow|market|mandi|vegetable|vegetables|any\s*vegetable|like\s*any\s*vegetable|crop|crops|produce|all|any|food|grain|fruits?)\b/i.test(candidate)
    ) {
      return candidate.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  return null;
}

/**
 * Extract district / mandi location if present in query
 * @param {string} text
 * @returns {string|null}
 */
function extractLocationMention(text) {
  if (!text) return null;
  const locations = [
    { name: 'Nashik', patterns: [/\bnashik\b/i, /\bnasik\b/i, /नाशिक/i, /नासिक/i, /નાસિક/i, /નાશિક/i] },
    { name: 'Lasalgaon', patterns: [/\blasalgaon\b/i, /लासलगाव/i, /લાસલગામ/i] },
    { name: 'Pune', patterns: [/\bpune\b/i, /पुणे/i, /પુણે/i] },
    { name: 'Mumbai', patterns: [/\bmumbai\b/i, /\bvashi\b/i, /मुंबई/i, /वाशी/i, /મુંબઈ/i] },
    { name: 'Ahmednagar', patterns: [/\bahmednagar\b/i, /\bahilyanagar\b/i, /अहमदनगर/i, /अहिल्यानगर/i, /અહેમદનગર/i] },
    { name: 'Nagpur', patterns: [/\bnagpur\b/i, /नागपूर/i, /नागपुर/i, /નાગપુર/i] },
    { name: 'Kolhapur', patterns: [/\bkolhapur\b/i, /कोल्हापूर/i, /कोल्हापुर/i, /કોલ્હાપુર/i] },
    { name: 'Solapur', patterns: [/\bsolapur\b/i, /सोलापूर/i, /सोलापुर/i, /સોલાપુર/i] },
    { name: 'Jalgaon', patterns: [/\bjalgaon\b/i, /जळगाव/i, /जलगांव/i, /જળગાંવ/i] },
    { name: 'Sangli', patterns: [/\bsangli\b/i, /सांगली/i, /સાંગલી/i] },
    { name: 'Satara', patterns: [/\bsatara\b/i, /सातारा/i, /સાતારા/i] },
    { name: 'Amravati', patterns: [/\bamravati\b/i, /अमरावती/i, /અમરાવતી/i] },
    { name: 'Chhatrapati Sambhajinagar', patterns: [/\bchhatrapati sambhajinagar\b/i, /\baurangabad\b/i, /औरंगाबाद/i, /संभाजीनगर/i] },
    { name: 'Surat', patterns: [/\bsurat\b/i, /सूरत/i, /सुरत/i] },
    { name: 'Ahmedabad', patterns: [/\bahmedabad\b/i, /अहमदाबाद/i, /અમદાવાદ/i] },
    { name: 'Rajkot', patterns: [/\brajkot\b/i, /राजकोट/i, /રાજકોટ/i] }
  ];

  for (const loc of locations) {
    for (const pattern of loc.patterns) {
      if (pattern.test(text)) return loc.name;
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
  extractLocationMention,
  extractQuantity,
  INTENT_PATTERNS
};
