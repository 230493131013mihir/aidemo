/**
 * cropDoctorService.js
 * Authoritative Agricultural Crop Health & Pathology Advisory Service
 * HarvestMitra AI
 *
 * Provides:
 * 1. Dynamic crop list loading from backend APMC database (/api/markets/crops) with comprehensive Maharashtra/Gujarat agricultural fallback
 * 2. Curated, university-verified plant pathology reference guides across English, Marathi, Hindi, Gujarati
 * 3. Transparent distinction between sample demonstrations and real user image uploads (no fabricated confidence scores)
 * 4. Safe IPM & organic remedy guidelines without unapproved chemical recipes
 */

import { fetchCrops } from './marketApiService.js';

export const CROP_CATEGORIES = [
  { id: 'all', labelKey: 'cropDoctor.allCategories', defaultLabel: 'All Crops' },
  { id: 'vegetable', labelKey: 'cropDoctor.categoryVegetables', defaultLabel: 'Vegetables' },
  { id: 'grain', labelKey: 'cropDoctor.categoryGrains', defaultLabel: 'Grains & Cereals' },
  { id: 'oilseed', labelKey: 'cropDoctor.categoryOilseeds', defaultLabel: 'Oilseeds & Cash Crops' },
  { id: 'pulse', labelKey: 'cropDoctor.categoryPulses', defaultLabel: 'Pulses & Legumes' },
  { id: 'fruit', labelKey: 'cropDoctor.categoryFruits', defaultLabel: 'Fruits & Horticulture' },
];

/**
 * Authoritative Master Catalog of Maharashtra & Gujarat Agricultural Crops
 */
export const AUTHORITATIVE_CROPS = [
  // Vegetables
  { id: 'tomato', nameEn: 'Tomato', nameMr: 'टोमॅटो', nameHi: 'टमाटर', nameGu: 'ટામેટા', category: 'vegetable' },
  { id: 'onion', nameEn: 'Onion', nameMr: 'कांदा', nameHi: 'प्याज', nameGu: 'ડુંગળી', category: 'vegetable' },
  { id: 'potato', nameEn: 'Potato', nameMr: 'बटाटा', nameHi: 'आलू', nameGu: 'બટાકા', category: 'vegetable' },
  { id: 'brinjal', nameEn: 'Brinjal', nameMr: 'वांगी', nameHi: 'बैंगन', nameGu: 'રીંગણ', category: 'vegetable' },
  { id: 'chilli', nameEn: 'Green Chilli', nameMr: 'हिरवी मिरची', nameHi: 'हरी मिर्च', nameGu: 'લીલા મરચાં', category: 'vegetable' },
  { id: 'ladyfinger', nameEn: 'Lady Finger', nameMr: 'भेंडी', nameHi: 'भिंडी', nameGu: 'ભીંડા', category: 'vegetable' },
  { id: 'cabbage', nameEn: 'Cabbage', nameMr: 'कोबी', nameHi: 'पत्ता गोभी', nameGu: 'કોબી', category: 'vegetable' },
  { id: 'cauliflower', nameEn: 'Cauliflower', nameMr: 'फ्लॉवर', nameHi: 'फूलगोभी', nameGu: 'ફૂલકોબી', category: 'vegetable' },
  { id: 'garlic', nameEn: 'Garlic', nameMr: 'लसूण', nameHi: 'लहसुन', nameGu: 'લસણ', category: 'vegetable' },

  // Grains & Cereals
  { id: 'rice', nameEn: 'Rice (Paddy)', nameMr: 'भात / तांदूळ', nameHi: 'चावल / धान', nameGu: 'ડાંગર / ચોખા', category: 'grain' },
  { id: 'wheat', nameEn: 'Wheat', nameMr: 'गहू', nameHi: 'गेहूं', nameGu: 'ઘઉં', category: 'grain' },
  { id: 'maize', nameEn: 'Maize', nameMr: 'मका', nameHi: 'मक्का', nameGu: 'મકાઈ', category: 'grain' },

  // Cash Crops & Oilseeds
  { id: 'sugarcane', nameEn: 'Sugarcane', nameMr: 'ऊस', nameHi: 'गन्ना', nameGu: 'શેરડી', category: 'oilseed' },
  { id: 'cotton', nameEn: 'Cotton', nameMr: 'कापूस', nameHi: 'कपास', nameGu: 'કપાસ', category: 'oilseed' },
  { id: 'soybean', nameEn: 'Soybean', nameMr: 'सोयाबीन', nameHi: 'सोयाबीन', nameGu: 'સોયાબીન', category: 'oilseed' },
  { id: 'groundnut', nameEn: 'Groundnut', nameMr: 'भुईमूग', nameHi: 'मूंगफली', nameGu: 'મગફળી', category: 'oilseed' },
  { id: 'mustard', nameEn: 'Mustard', nameMr: 'मोहरी', nameHi: 'सरसों', nameGu: 'રાઈ', category: 'oilseed' },

  // Pulses
  { id: 'chickpea', nameEn: 'Chickpea (Gram)', nameMr: 'हरभरा (चना)', nameHi: 'चना', nameGu: 'ચણા', category: 'pulse' },
  { id: 'tur', nameEn: 'Pigeon Pea (Tur)', nameMr: 'तूर', nameHi: 'अरहर (तूर)', nameGu: 'તુવેર', category: 'pulse' },

  // Fruits & Horticulture
  { id: 'grapes', nameEn: 'Grapes', nameMr: 'द्राक्षे', nameHi: 'अंगूर', nameGu: 'દ્રાક્ષ', category: 'fruit' },
  { id: 'banana', nameEn: 'Banana', nameMr: 'केळी', nameHi: 'केला', nameGu: 'કેળાં', category: 'fruit' },
  { id: 'pomegranate', nameEn: 'Pomegranate', nameMr: 'डाळिंब', nameHi: 'अनार', nameGu: 'દાડમ', category: 'fruit' }
];

/**
 * Curated plant pathology reference guides across English, Marathi, Hindi, and Gujarati
 */
export const CROP_PATHOLOGY_RECORDS = {
  tomato: {
    crop: 'Tomato',
    cropKey: 'tomato',
    category: 'vegetable',
    diseaseName: {
      en: 'Early Blight (Alternaria solani)',
      mr: 'टोमॅटोवरील करपा (अल्टरनेरिया सोलानी)',
      hi: 'अगेती झुलसा (अल्टर्नेरिया सोलानी)',
      gu: 'ટામેટાનો આગોતરો સુકારો (અલ્ટરનેરિયા સોલાની)'
    },
    severity: {
      en: 'Moderate (Foliar Target Spots)',
      mr: 'मध्यम (पानांवर गोलाकार डाग)',
      hi: 'मध्यम (पत्तियों पर गोल धब्बे)',
      gu: 'મધ્યમ (પાન પર ગોળાકાર ડાઘ)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Concentric dark brown rings with chlorotic yellow halo on lower older foliage, progressing upwards.',
      mr: 'खालच्या जुन्या पानांवर काळे-तपकिरी गोलाकार वलय आणि भोवती पिवळसर छटा दिसणे.',
      hi: 'निचली पत्तियों पर गहरे भूरे संकेंद्री छल्ले और उनके चारों ओर पीलापन आना।',
      gu: 'નીચલાં જૂનાં પાંદડાં પર કાળા-બદામી કૂંડાળાં અને તેની આસપાસ પીળાશ પડતો ભાગ દેખાવો.'
    },
    organicRemedy: {
      en: 'Spray cold-pressed Neem Oil (10,000 ppm) @ 3.5 ml/L + Trichoderma viride biological culture (5 g/L). Remove severely infected bottom leaves.',
      mr: '१०,००० ppm कडुलिंब तेल ३.५ मिली/लिटर + ट्रायकोडर्मा व्हिरिडी ५ ग्रॅम/लिटर फवारणी करावी. बाधित खालची पाने काढून नष्ट करा.',
      hi: 'कोल्ड प्रेस्ड नीम तेल (10,000 ppm) 3.5 मिली/लीटर + ट्राइकोडर्मा विरिडी 5 ग्राम/लीटर का छिड़काव करें। संक्रमित पत्तियां हटा दें।',
      gu: '૧૦,૦૦૦ ppm લીમડાનું તેલ ૩.૫ મિલી/લીટર + ટ્રાઇકોડર્મા વિરીડી ૫ ગ્રામ/લીટરનો છંટકાવ કરો. વધુ રોગગ્રસ્ત નીચેનાં પાન દૂર કરો.'
    },
    chemicalRemedy: {
      en: 'Apply CIB&RC approved Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1 ml/L. Always consult local agronomist and observe waiting periods.',
      mr: 'कृषी विद्यापीठ शिफारशीनुसार मँकोझेब ७५% WP २.५ ग्रॅम/लिटर किंवा ॲझॉक्सीस्ट्रॉबिन २३% SC १ मिली/लिटर फवारावे. संरक्षक किट वापरा.',
      hi: 'अनुशंसित मैंकोजेब 75% WP 2.5 ग्राम/लीटर अथवा एज़ोक्सीस्ट्रोबिन 23% SC 1 मिली/लीटर का उपयोग करें। सुरक्षा उपकरण पहनें।',
      gu: 'ભલામણ કરેલ મેન્કોઝેબ ૭૫% WP ૨.૫ ગ્રામ/લીટર અથવા એઝોક્સીસ્ટ્રોબિન ૨૩% SC ૧ મિલી/લીટરનો છંટકાવ કરવો. સુરક્ષા કાળજી રાખો.'
    },
    subsidyGuideline: {
      en: 'Eligible for 50% National Horticulture Mission (NHM) biological pest management assistance at Taluka Krishi Bhavan.',
      mr: 'तालुका कृषी कार्यालयात राष्ट्रीय फलोत्पादन अभियानांतर्गत ५०% जैविक कीड नियंत्रण अनुदान पात्र.',
      hi: 'तालुका कृषि कार्यालय में राष्ट्रीय बागवानी मिशन के अंतर्गत 50% जैविक कीट नियंत्रण सहायता उपलब्ध।',
      gu: 'તાલુકા કૃષિ કચેરી ખાતે રાષ્ટ્રીય બાગાયત મિશન હેઠળ ૫૦% જૈવિક નિયંત્રણ સહાય માટે પાત્ર.'
    }
  },

  onion: {
    crop: 'Onion',
    cropKey: 'onion',
    category: 'vegetable',
    diseaseName: {
      en: 'Purple Blotch (Alternaria porri)',
      mr: 'कांद्यावरील जांभळा करपा (अल्टरनेरिया पोरी)',
      hi: 'बैंगनी धब्बा रोग (अल्टर्नेरिया पोरी)',
      gu: 'ડુંગળીનો જાંબલી ચરમી (અલ્ટરનેરિયા પોરી)'
    },
    severity: {
      en: 'Mild to Moderate (Leaf Shaft Lesions)',
      mr: 'सौम्य ते मध्यम (पातीच्या देठावर जांभळे चट्टे)',
      hi: 'हल्का से मध्यम (पत्तियों पर बैंगनी धब्बे)',
      gu: 'હળવોથી મધ્યમ (પાંદડા પર જાંબુડિયા ડાઘ)'
    },
    severityLevel: 'mild',
    symptoms: {
      en: 'Small water-soaked sunken lesions with distinctive purplish centers on leaf shafts, causing foliage breakdown.',
      mr: 'पातीवर सुरुवातीला पांढरट-पाणथळ चट्टे पडून नंतर मध्यभागी जांभळट रंग येणे व पात वाळणे.',
      hi: 'पत्तियों पर छोटे पानी जैसे धब्बे जिनका केंद्र बैंगनी हो जाता है, जिससे पत्तियां सूखने लगती हैं।',
      gu: 'પાંદડા પર નાના પાણીવાળા ડાઘ જેના મધ્યમાં જાંબલી રંગ થાય છે અને પાન સુકાવા લાગે છે.'
    },
    organicRemedy: {
      en: 'Spray fermented sour buttermilk extract (50 ml/L) mixed with ginger-garlic extract. Ensure proper field drainage.',
      mr: 'आंबट ताक ५० मिली/लिटर + आले-लसूण अर्क फवारावा. शेतात पाणी साचू देऊ नये.',
      hi: 'खट्टी छाछ (50 मिली/लीटर) में अदरक-लहसुन अर्क मिलाकर छिड़कें। खेत में जल निकासी दुरुस्त रखें।',
      gu: 'ખાટી છાશ (૫૦ મિલી/લીટર) સાથે આદુ-લસણનો અર્ક મિક્સ કરી છંટકાવ કરો. ખેતરમાં પાણીનો ભરાવો ન થવા દો.'
    },
    chemicalRemedy: {
      en: 'Apply Difenoconazole 25% EC @ 1 ml/L or Chlorothalonil 75% WP @ 2 g/L with non-ionic agricultural sticker.',
      mr: 'डायफेनोकोनॅझोल २५% EC १ मिली/लिटर किंवा क्लोरोथॅलोनिल ७५% WP २ ग्रॅम/लिटर स्टीकर मिसळून फवारावे.',
      hi: 'डाइफेनोकोनाजोल 25% EC 1 मिली/लीटर या क्लोरोथैलोनिल 75% WP 2 ग्राम/लीटर स्टीकर के साथ प्रयोग करें।',
      gu: 'ડાયફેનોકોનાઝોલ ૨૫% EC ૧ મિલી/લીટર અથવા ક્લોરોથેલોનિલ ૭૫% WP ૨ ગ્રામ/લીટર સ્ટીકર સાથે છંટકાવ કરવો.'
    },
    subsidyGuideline: {
      en: 'Monitored under State Agriculture Department Kharif & Rabi Plant Protection Campaign.',
      mr: 'राज्य कृषी विभागाच्या खरीप/रब्बी पीक संरक्षण अभियानांतर्गत नोंदणीकृत.',
      hi: 'राज्य कृषि विभाग के खरीफ/रबी फसल सुरक्षा अभियान के अंतर्गत सूचीबद्ध।',
      gu: 'રાજ્ય કૃષિ વિભાગના ખરીફ/રવિ પાક સંરક્ષણ અભિયાન હેઠળ નોંધાયેલ.'
    }
  },

  potato: {
    crop: 'Potato',
    cropKey: 'potato',
    category: 'vegetable',
    diseaseName: {
      en: 'Late Blight (Phytophthora infestans)',
      mr: 'बटाट्यावरील तांबेरा / उशिरा येणारा करपा',
      hi: 'पछेती झुलसा (फाइटोफ्थोरा इन्फेस्टन्स)',
      gu: 'બટાકાનો પાછોતરો સુકારો (ફાઇટોફ્થોરા)'
    },
    severity: {
      en: 'High / Critical (Rapid Foliar Necrosis)',
      mr: 'गंभीर (पाने व खोड वेगाने काळे पडणे)',
      hi: 'गंभीर (पत्तियां व तना तेजी से काला पड़ना)',
      gu: 'ગંભીર (પાન અને થડ ઝડપથી કાળાં પડી જવાં)'
    },
    severityLevel: 'critical',
    symptoms: {
      en: 'Water-soaked dark lesions spreading rapidly with white fungal mildew visible on leaf undersides in humid weather.',
      mr: 'पानांवर काळपट डाग आणि ढगाळ दमट हवेत पानाच्या खालच्या बाजूला पांढरी बुरशी दिसणे.',
      hi: 'पत्तियों पर गीले काले धब्बे जो नमी में तेजी से फैलते हैं और पत्ती के नीचे सफेद फफूंद दिखती है।',
      gu: 'પાન પર ભીના કાળા ડાઘ જે ભેજવાળા વાતાવરણમાં ઝડપથી ફેલાય છે અને પાનની નીચે સફેદ ફૂગ દેખાય છે.'
    },
    organicRemedy: {
      en: 'Immediately rogue out severely diseased plants. Spray Copper Hydroxide @ 2 g/L or Bordeaux Mixture (1%).',
      mr: 'अतिबाधित रोपे उपटून नष्ट करा. कॉपर हायड्रॉक्साइड २ ग्रॅम/लिटर किंवा १% बोर्डो मिश्रण फवारावे.',
      hi: 'संक्रमित पौधों को तुरंत उखाड़कर नष्ट करें। कॉपर हाइड्रोक्साइड 2 ग्राम/लीटर या 1% बोर्डो मिश्रण छिड़कें।',
      gu: 'વધુ રોગગ્રસ્ત છોડને તરત ઉખેડી બાળી નાખો. કોપર હાઇડ્રોક્સાઇડ ૨ ગ્રામ/લીટર અથવા ૧% બોર્ડો મિશ્રણ છાંટો.'
    },
    chemicalRemedy: {
      en: 'Systemic curative: Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/L. Spray during morning hours with protective mask.',
      mr: 'सायमोक्सॅनिल ८% + मँकोझेब ६४% WP २.५ ग्रॅम/लिटर फवारणी करावी. फवारणी करताना मास्क वापरा.',
      hi: 'साइमोक्सानिल 8% + मैंकोजेब 64% WP 2.5 ग्राम/लीटर का सुबह के समय सुरक्षा मास्क पहनकर छिड़काव करें।',
      gu: 'સાયમોક્સાનીલ ૮% + મેન્કોઝેબ ૬૪% WP ૨.૫ ગ્રામ/લીટર સવારના સમયે માસ્ક પહેરીને છંટકાવ કરવો.'
    },
    subsidyGuideline: {
      en: 'Priority advisory issued through Central Potato Research Institute (CPRI) & APMC plant health cell.',
      mr: 'केंद्रीय बटाटा संशोधन संस्था (CPRI) आणि स्थानिक कृषी विज्ञान केंद्र मार्गदर्शिकेनुसार.',
      hi: 'केंद्रीय आलू अनुसंधान संस्थान (CPRI) एवं कृषि विज्ञान केंद्र की त्वरित सलाह के अंतर्गत।',
      gu: 'કેન્દ્રીય બટાકા સંશોધન સંસ્થા (CPRI) અને કેવીકે પ્લાન્ટ હેલ્થ ગાઇડલાઇન મુજબ.'
    }
  },

  cotton: {
    crop: 'Cotton',
    cropKey: 'cotton',
    category: 'oilseed',
    diseaseName: {
      en: 'Cotton Leaf Curl Virus (CLCuV)',
      mr: 'कापसावरील पानांचा चुरमुर / लीफ कर्ल व्हायरस',
      hi: 'कपास पर्ण कुंचन विषाणु रोग (लीफ कर्ल)',
      gu: 'કપાસનો પાનનો કોકડવો (લીફ કર્લ વાયરસ)'
    },
    severity: {
      en: 'Moderate (Upward Cup Rolling)',
      mr: 'मध्यम (पाने वरच्या बाजूला वाटीसारखी वळणे)',
      hi: 'मध्यम (पत्तियां ऊपर की ओर मुड़ना)',
      gu: 'મધ્યમ (પાન ઉપર તરફ વાટકા જેવા વળી જવા)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Upward curling of leaves, vein thickening and enations on undersides transmitted by whitefly insect vectors.',
      mr: 'पाने वरच्या बाजूला वाटीसारखी वळणे, शिरा जाड होणे आणि पांढऱ्या माशीचा प्रादुर्भाव असणे.',
      hi: 'पत्तियों का ऊपर की ओर मुड़ना, नसों का मोटा होना और सफेद मक्खी कीट का प्रकोप दिखना।',
      gu: 'પાન ઉપર તરફ વાટકા આકારે વળી જવાં, નસો જાડી થવી અને સફેદ માખીનો ઉપદ્રવ જોવા મળવો.'
    },
    organicRemedy: {
      en: 'Install 12 yellow sticky traps per acre to trap whiteflies. Spray 5% Neem Seed Kernel Extract (NSKE).',
      mr: 'पांढरी माशी नियंत्रणासाठी एकरी १२ पिवळे चिकट सापळे लावा. ५% निंबोळी अर्क (NSKE) फवारावा.',
      hi: 'सफेद मक्खी पर नियंत्रण के लिए प्रति एकड़ 12 पीले चिपचिपे जाल लगाएं। 5% नीम बीज अर्क छिड़कें।',
      gu: 'સફેદ માખીના નિયંત્રણ માટે એકરે ૧૨ પીળા સ્ટીકી ટ્રેપ લગાવો. ૫% લીંબોળીના મીંજનો અર્ક છાંટો.'
    },
    chemicalRemedy: {
      en: 'Vector suppression: Diafenthiuron 50% WP @ 1.2 g/L or Pyriproxyfen 10% EC @ 1.5 ml/L. Never spray during peak bee foraging hours.',
      mr: 'पांढरी माशीसाठी डायाफेन्थिरॉन ५०% WP १.२ ग्रॅम/लिटर किंवा पायरिप्रॉक्सिफेन १०% EC १.५ मिली/लिटर. मधमाश्या असताना फवारणी टाळा.',
      hi: 'कीट वाहक रोकथाम: डायाफेंथियूरॉन 50% WP 1.2 ग्राम/लीटर या पाइरीप्रॉक्सीफेन 10% EC 1.5 मिली/लीटर। मधुमक्खियों के समय छिड़काव न करें।',
      gu: 'વાહક કીટક નિયંત્રણ: ડાયાફેન્થિયુરોન ૫૦% WP ૧.૨ ગ્રામ/લીટર અથવા પાયરીપ્રોક્સીફેન ૧૦% EC ૧.૫ મિલી/લીટર. મધમાખી સમયે છંટકાવ ટાળો.'
    },
    subsidyGuideline: {
      en: 'Covered under National Food Security Mission (Commercial Crops - Cotton IPM) scheme.',
      mr: 'राष्ट्रीय अन्न सुरक्षा अभियान (व्यापारी पिके - कापूस IPM) अनुदान पॅकेज अंतर्गत समाविष्ट.',
      hi: 'राष्ट्रीय खाद्य सुरक्षा मिशन (व्यावसायिक फसलें - कपास IPM) योजना के अंतर्गत कवर।',
      gu: 'રાષ્ટ્રીય ખાદ્ય સુરક્ષા મિશન (કપાસ IPM) સહાય યોજના હેઠળ આવરી લેવાયેલ.'
    }
  },

  soybean: {
    crop: 'Soybean',
    cropKey: 'soybean',
    category: 'oilseed',
    diseaseName: {
      en: 'Soybean Rust & Pod Blight (Phakopsora pachyrhizi)',
      mr: 'सोयाबीनवरील तांबेरा व शेंगा करपा',
      hi: 'सोयाबीन गेरूई एवं फली झुलसा',
      gu: 'સોયાબીનનો ગેરુ અને શિંગોનો સુકારો'
    },
    severity: {
      en: 'Moderate (Yellow-Brown Rust Pustules)',
      mr: 'मध्यम (पानांखालील तांबूस-तपकिरी ठिपके)',
      hi: 'मध्यम (पत्तियों के नीचे भूरे-लाल धब्बे)',
      gu: 'મધ્યમ (પાન નીચે લાલાશ પડતા બદામી ટપકાં)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Tiny reddish-brown pustules on lower leaf surfaces causing early defoliation and poor seed filling in pods.',
      mr: 'पानांच्या खालच्या बाजूला बारीक तांबूस-तपकिरी पुरळ येणे, पाने गळणे आणि शेंगांमध्ये दाणे बारीक राहणे.',
      hi: 'पत्तियों की निचली सतह पर छोटे लाल-भूरे उभरे धब्बे, पत्तियां गिरना और फलियों में दाने न भरना।',
      gu: 'પાનની નીચેની સપાટી પર નાના લાલ-બદામી ફોલ્લા જેવા ટપકાં થવાં, પાન ખરી પડવાં અને શિંગોમાં દાણા બરાબર ન ભરાવા.'
    },
    organicRemedy: {
      en: 'Spray Pseudomonas fluorescens (5 g/L) + Neem cake soil application at sowing. Maintain optimum plant spacing.',
      mr: 'स्यूडोमोनास फ्लुओरेसेन्स ५ ग्रॅम/लिटर फवारणी. लागवडीवेळी निंबोळी पेंड जमिनीत टाकावी.',
      hi: 'स्यूडोमोनास फ्लोरेसेंस (5 ग्राम/लीटर) का छिड़काव करें। नीम की खली का खेत में प्रयोग करें।',
      gu: 'સ્યુડોમોનાસ ફ્લોરેસન્સ (૫ ગ્રામ/લીટર) નો છંટકાવ. વાવણી વખતે લીંબોળી ખોળ જમીનમાં આપો.'
    },
    chemicalRemedy: {
      en: 'Apply Tebuconazole 25.9% EC @ 1 ml/L or Hexaconazole 5% EC @ 2 ml/L at first appearance of rust spots.',
      mr: 'रोग दिसताच टेब्युकोनॅझोल २५.९% EC १ मिली/लिटर किंवा हेक्साकोनॅझोल ५% EC २ मिली/लिटर फवारावे.',
      hi: 'लक्षण दिखते ही टेबुकोनाजोल 25.9% EC 1 मिली/लीटर या हेक्साकोनाजोल 5% EC 2 मिली/लीटर का छिड़काव करें।',
      gu: 'લક્ષણો દેખાય કે તરત ટેબુકોનાઝોલ ૨૫.૯% EC ૧ મિલી/લીટર અથવા હેક્સાકોનાઝોલ ૫% EC ૨ મિલી/લીટર છાંટો.'
    },
    subsidyGuideline: {
      en: 'Advisory supported by ICAR-Indian Institute of Soybean Research (IISR), Indore & Maharashtra Agriculture Dept.',
      mr: 'भारतीय सोयाबीन संशोधन संस्था (IISR) आणि कृषी विभाग महाराष्ट्र शासन शिफारशीनुसार.',
      hi: 'भारतीय सोयाबीन अनुसंधान संस्थान (IISR) इंदौर एवं राज्य कृषि विभाग की सिफारिश अनुसार।',
      gu: 'ભારતીય સોયાબીન સંશોધન સંસ્થા (IISR) અને રાજ્ય કૃષિ વિભાગની ભલામણ અનુસાર.'
    }
  },

  sugarcane: {
    crop: 'Sugarcane',
    cropKey: 'sugarcane',
    category: 'oilseed',
    diseaseName: {
      en: 'Sugarcane Red Rot (Colletotrichum falcatum)',
      mr: 'उसावरील तांबडा कुजव्या / रेड रॉट रोग',
      hi: 'गन्ने का लाल सड़न रोग (रेड रॉट)',
      gu: 'શેરડીનો લાલ સડો રોગ (રેડ રોટ)'
    },
    severity: {
      en: 'Critical (Internal Cane Discoloration & Drying)',
      mr: 'गंभीर (कांड्या आतील लाल होणे व ऊस वाळणे)',
      hi: 'गंभीर (गन्ने के अंदर लाल रंग व सूखना)',
      gu: 'ગંભીર (શેરડી અંદરથી લાલ થઈ સુકાઈ જવી)'
    },
    severityLevel: 'critical',
    symptoms: {
      en: 'Third and fourth leaves wither from tip downward. Splitting the cane reveals red tissue with characteristic white cross patches and alcoholic odor.',
      mr: 'उसाचे शेंडे वाळणे, कांडी उभी चिरल्यास आतील गर लाल दिसणे, पांढरे पट्टे आढळणे आणि आंबट वास येणे.',
      hi: 'ऊपरी पत्तियां सूखना, गन्ने को चीरने पर अंदर का गूदा लाल व बीच में सफेद पट्टियां दिखना एवं सिरके जैसी गंध आना।',
      gu: 'ઉપરની ડૂંખ સુકાવી, શેરડી ચીરતાં અંદરનો ગર લાલ દેખાવો, સફેદ પટ્ટા હોવા અને ખાટી વાસ આવવી.'
    },
    organicRemedy: {
      en: 'Use healthy disease-free seed setts. Treat setts with Trichoderma harzianum @ 10 g/L for 30 minutes before planting. Practice crop rotation.',
      mr: 'निरोगी बेणे वापरा. लागवडीपूर्वी बेण्यास ट्रायकोडर्मा १० ग्रॅम/लिटर द्रावणात ३० मिनिटे प्रक्रिया करावी. पिकांची फेरपालट करा.',
      hi: 'रोगमुक्त स्वस्थ बीज का उपयोग करें। बुवाई से पूर्व ट्राइकोडर्मा 10 ग्राम/लीटर से बीजोपचार करें। फसल चक्र अपनाएं।',
      gu: 'રોગમુક્ત સ્વસ્થ બિયારણ વાપરો. વાવણી પહેલાં ટ્રાઇકોડર્મા ૧૦ ગ્રામ/લીટરથી બીજ માવજત કરો. પાકની ફેરબદલી કરો.'
    },
    chemicalRemedy: {
      en: 'Dip seed setts in Carbendazim 50% WP @ 1 g/L solution. Uproot and burn diseased clumps immediately.',
      mr: 'बेणे कार्बेंडाझिम ५०% WP १ ग्रॅम/लिटर द्रावणात बुडवून लावावे. बाधित उसाची खोडकी उपटून जाळून नष्ट करावीत.',
      hi: 'बीज के टुकड़ों को कार्बेन्डाजिम 50% WP 1 ग्राम/लीटर के घोल में डुबोएं। संक्रमित पौधों को उखाड़कर जला दें।',
      gu: 'શેરડીના ટુકડાને કાર્બેન્ડાઝીમ ૫૦% WP ૧ ગ્રામ/લીટરના દ્રાવણમાં બોળીને રોપો. રોગિષ્ઠ શેરડીને ઉખેડી બાળી દો.'
    },
    subsidyGuideline: {
      en: 'Vasantdada Sugar Institute (VSI) Pune & Sugar Commissionerate certified seed multiplication protocol.',
      mr: 'वसंतदादा शुगर इन्स्टिट्यूट (VSI) पुणे आणि साखर आयुक्तालय प्रमाणित बेणे प्रक्रिया मार्गदर्शक.',
      hi: 'वसंतदादा शुगर इंस्टीट्यूट (VSI) पुणे एवं गन्ना विकास विभाग दिशा-निर्देशों के अनुरूप।',
      gu: 'વસંતદાદા સુગર ઇન્સ્ટિટ્યૂટ અને શેરડી વિકાસ માર્ગદર્શિકા મુજબ.'
    }
  },

  rice: {
    crop: 'Rice (Paddy)',
    cropKey: 'rice',
    category: 'grain',
    diseaseName: {
      en: 'Rice Blast & Bacterial Leaf Blight',
      mr: 'भातावरील करपा व जिवाणूजन्य पान करपा',
      hi: 'धान का झोंका (ब्लास्ट) एवं जीवाणु झुलसा',
      gu: 'ડાંગરનો ગેરુ / બ્લાસ્ટ અને બેક્ટેરિયલ સુકારો'
    },
    severity: {
      en: 'Moderate to High (Spindle Eye Lesions)',
      mr: 'मध्यम ते जास्त (पानांवर डोळ्याच्या आकाराचे चट्टे)',
      hi: 'मध्यम से गंभीर (नाव के आकार के धब्बे)',
      gu: 'મધ્યમથી વધારે (હોડી આકારના ત્રાક જેવા ડાઘ)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Spindle-shaped lesions with gray centers and brown borders on leaves. Neck rot occurs at panicle emergence.',
      mr: 'पानांवर दोन्ही टोकांना टोकदार, मध्यभागी करडे आणि कडेने तपकिरी डोळ्यासारखे डाग पडणे. लोंबीच्या मानेवर काळे चट्टे पडणे.',
      hi: 'पत्तियों पर आंख या नाव के आकार के धब्बे जिनका केंद्र धूसर और किनारे भूरे होते हैं। बाली की गर्दन पर कालापन आना।',
      gu: 'પાન પર ત્રાક આકારના ડાઘ જેનો વચ્ચેનો ભાગ રાખોડી અને કિનારી બદામી હોય છે. કંકીની ડોક કાળી પડી જવી.'
    },
    organicRemedy: {
      en: 'Seed treatment with Pseudomonas fluorescens @ 10 g/kg seed. Apply silica-rich organic manure to strengthen cell walls.',
      mr: 'बियाण्यास स्यूडोमोनास फ्लुओरेसेन्स १० ग्रॅम/किलो चोळावे. सिलिकॉनयुक्त खतांचा वापर करून झाडांची प्रतिकारशक्ती वाढवा.',
      hi: 'स्यूडोमोनास फ्लोरेसेंस (10 ग्राम/किग्रा बीज) से बीजोपचार करें। सिलिकायुक्त जैविक खाद का उपयोग करें।',
      gu: 'સ્યુડોમોનાસ ફ્લોરેસન્સ (૧૦ ગ્રામ/કિલો) થી બીજ માવજત. સિલિકાવાળા ઓર્ગેનિક ખાતરનો ઉપયોગ કરો.'
    },
    chemicalRemedy: {
      en: 'Apply Tricyclazole 75% WP @ 0.6 g/L or Isoprothiolane 40% EC @ 1.5 ml/L at tillering and panicle emergence stages.',
      mr: 'ट्रायसायक्लॅझोल ७५% WP ०.६ ग्रॅम/लिटर किंवा आयसोप्रोथिओलेन ४०% EC १.५ मिली/लिटर फवारावे.',
      hi: 'ट्राइसाइक्लाजोल 75% WP 0.6 ग्राम/लीटर या आइसोप्रोपाइल 40% EC 1.5 मिली/लीटर का छिड़काव करें।',
      gu: 'ટ્રાયસાયક્લાઝોલ ૭૫% WP ૦.૬ ગ્રામ/લીટર અથવા આઇસોપ્રોથિઓલેન ૪૦% EC ૧.૫ મિલી/લીટરનો છંટકાવ કરવો.'
    },
    subsidyGuideline: {
      en: 'Konkan Krishi Vidyapeeth (DBSKKV) & National Food Security Mission (NFSM-Rice) certified guidelines.',
      mr: 'डॉ. बाळासाहेब सावंत कोकण कृषी विद्यापीठ आणि राष्ट्रीय अन्न सुरक्षा अभियान (NFSM) प्रमाणित.',
      hi: 'राष्ट्रीय खाद्य सुरक्षा मिशन (NFSM धान) एवं राज्य कृषि विश्वविद्यालय द्वारा अनुशंसित।',
      gu: 'રાષ્ટ્રીય ખાદ્ય સુરક્ષા મિશન (NFSM ડાંગર) હેઠળ ભલામણ કરેલ.'
    }
  },

  wheat: {
    crop: 'Wheat',
    cropKey: 'wheat',
    category: 'grain',
    diseaseName: {
      en: 'Yellow / Brown Rust (Puccinia striiformis)',
      mr: 'गव्हावरील पिवळा / तांबडा तांबेरा',
      hi: 'गेहूं का पीला / भूरा रतुआ (रस्ट)',
      gu: 'ઘઉંનો પીળો / બદામી ગેરુ (રસ્ટ)'
    },
    severity: {
      en: 'Moderate (Linear Yellow Stripe Pustules)',
      mr: 'मध्यम (पानांवर पिवळ्या रंगाच्या ओळी)',
      hi: 'मध्यम (पत्तियों पर पीली धारियां)',
      gu: 'મધ્યમ (પાન પર પીળી પટ્ટીઓ)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Bright yellow linear rows of stripe rust pustules along leaf veins, powder rubs off on fingers.',
      mr: 'पानांच्या शिरांच्या समांतर पिवळ्या रंगाच्या रेषांत पुरळ उठणे व बोटाला पिवळी पावडर लागणे.',
      hi: 'पत्तियों की नसों के समानांतर चमकीली पीली धारियां बनना, छूने पर उंगलियों पर पीला पाउडर लगना।',
      gu: 'પાનની નસોને સમાંતર પીળી પટ્ટીઓમાં ફોલ્લીઓ થવી અને આંગળી અડાડતાં પીળો પાવડર ચોંટવો.'
    },
    organicRemedy: {
      en: 'Sow rust-resistant varieties recommended for Western Maharashtra & Gujarat. Avoid excess nitrogen fertilization.',
      mr: 'तांबेरा-प्रतिकारक वाणांची पेरणी करावी. युरिया खताचा अतिरेकी वापर टाळावा.',
      hi: 'रोग-प्रतिरोधी किस्मों की बुवाई करें। यूरिया का अत्यधिक उपयोग न करें।',
      gu: 'રોગ પ્રતિકારક જાતોની વાવણી કરો. યુરિયા ખાતરનો વધુ પડતો ઉપયોગ ટાળો.'
    },
    chemicalRemedy: {
      en: 'Spray Propiconazole 25% EC @ 1 ml/L or Tebuconazole 25.9% EC @ 1 ml/L at first appearance of stripe rust.',
      mr: 'प्रोपिकोनेझोल २५% EC १ मिली/लिटर किंवा टेब्युकोनॅझोल १ मिली/लिटर फवारावे.',
      hi: 'प्रोपिकोनाजोल 25% EC 1 मिली/लीटर अथवा टेबुकोनाजोल 1 मिली/लीटर का छिड़काव करें।',
      gu: 'પ્રોપિકોનાઝોલ ૨૫% EC ૧ મિલી/લીટર અથવા ટેબુકોનાઝોલ ૧ મિલી/લીટરનો છંટકાવ કરવો.'
    },
    subsidyGuideline: {
      en: 'Indian Institute of Wheat & Barley Research (IIWBR) Karnal Wheat Disease Surveillance Protocol.',
      mr: 'भारतीय गहू व बार्ली संशोधन संस्था (IIWBR) तांबेरा सर्वेक्षण प्रणाली अंतर्गत.',
      hi: 'भारतीय गेहूं एवं जौ अनुसंधान संस्थान (IIWBR) करनाल रतुआ निगरानी प्रोटोकॉल के तहत।',
      gu: 'ભારતીય ઘઉં સંશોધન સંસ્થા (IIWBR) ની ગેરુ નિરીક્ષણ ગાઇડલાઇન મુજબ.'
    }
  },

  maize: {
    crop: 'Maize',
    cropKey: 'maize',
    category: 'grain',
    diseaseName: {
      en: 'Fall Armyworm (FAW) & Turcicum Leaf Blight',
      mr: 'मक्यावरील लष्करी अळी व टर्सिकम करपा',
      hi: 'मक्के का फॉल आर्मीवर्म एवं टर्सिकम झुलसा',
      gu: 'મકાઈનો ફોલ આર્મીવોર્મ (લશ્કરી ઇયળ) અને પાનનો સુકારો'
    },
    severity: {
      en: 'Moderate to High (Whorl Leaf Damage)',
      mr: 'मध्यम ते जास्त (पोंगा खाऊन पाने चाळणी होणे)',
      hi: 'मध्यम से गंभीर (पत्तियों में छेद व पोंगा नष्ट होना)',
      gu: 'મધ્યમથી વધારે (પાનમાં કાણાં પડી ચાળણી થવી)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Shot holes and ragged margins on whorl leaves with sawdust-like frass. Long spindle-shaped gray leaf lesions.',
      mr: 'पोंगा पानांवर छिद्रे पडणे, पानांच्या कडा फाटणे, विष्ठेचा भुसा दिसणे आणि पानांवर लांबट करडे चट्टे.',
      hi: 'पोंगा में पत्तियों पर छेद, लकड़ी के बुरादे जैसा मल दिखना और पत्तियों पर लंबे धूसर धब्बे।',
      gu: 'ડૂંખનાં પાનમાં કાણાં પડવાં, લાકડાના વહેર જેવો મળ દેખાવો અને પાન પર લાંબા રાખોડી ડાઘ.'
    },
    organicRemedy: {
      en: 'Drop fine sand mixed with wood ash into whorls. Release egg parasitoids (Trichogramma pretiosum) @ 50,000/acre. Spray Metarhizium rileyi @ 5 g/L.',
      mr: 'पोंगा पानांत बारीक वाळू व राख टाकावी. ट्रायकोकार्ड एकरी २-३ लावावे. मेटारायझियम ५ ग्रॅम/लिटर फवारावे.',
      hi: 'पोंगा में रेत और राख डालें। ट्राइकोग्रामा परजीवी (50,000/एकड़) छोड़ें। मेटाराइजियम 5 ग्राम/लीटर छिड़कें।',
      gu: 'ડૂંખમાં રેતી અને રાખ મિક્સ કરી નાખો. ટ્રાઇકોગ્રામા કાર્ડ લગાવો. મેટારાઇઝિયમ ૫ ગ્રામ/લીટર છાંટો.'
    },
    chemicalRemedy: {
      en: 'Direct whorl application of Chlorantraniliprole 18.5% SC @ 0.4 ml/L or Emamectin Benzoate 5% SG @ 0.5 g/L. Wear face shield.',
      mr: 'क्लोराँट्रानिलीप्रोल १८.५% SC ०.४ मिली/लिटर किंवा इमामेक्टिन बेन्झोएट ५% SG ०.५ ग्रॅम/लिटर पोंग्यात पडेल असे फवारावे.',
      hi: 'क्लोरांट्रानिलीप्रोल 18.5% SC 0.4 मिली/लीटर या इमामेक्टिन बेंजोएट 5% SG 0.5 ग्राम/लीटर का पोंगा में छिड़काव करें।',
      gu: 'ક્લોરાન્ટ્રાનિલીપ્રોલ ૧૮.૫% SC ૦.૪ મિલી/લીટર અથવા ઇમામેક્ટીન બેન્ઝોએટ ૫% SG ૦.૫ ગ્રામ/લીટર ડૂંખમાં છાંટો.'
    },
    subsidyGuideline: {
      en: 'State Agriculture Department emergency Fall Armyworm containment advisory.',
      mr: 'कृषी विभाग महाराष्ट्र शासन लष्करी अळी नियंत्रण मोहीम अंतर्गत.',
      hi: 'राज्य कृषि विभाग फॉल आर्मीवर्म रोकथाम अभियान दिशा-निर्देश अनुसार।',
      gu: 'રાજ્ય કૃષિ વિભાગ લશ્કરી ઇયળ નિયંત્રણ અભિયાન મુજબ.'
    }
  },

  grapes: {
    crop: 'Grapes',
    cropKey: 'grapes',
    category: 'fruit',
    diseaseName: {
      en: 'Downy Mildew & Powdery Mildew',
      mr: 'द्राक्षावरील केवडा व भुरी रोग',
      hi: 'अंगूर का डाउनी मिल्ड्यू एवं चूर्णिल फफूंद (पाउडरी)',
      gu: 'દ્રાક્ષનો તળછારો (ડાઉની) અને છારો (પાવડરી)'
    },
    severity: {
      en: 'High (Berry & Shoot Infection)',
      mr: 'गंभीर (घडावर व पानांवर पांढरी बुरशी)',
      hi: 'गंभीर (गुच्छों व पत्तियों पर सफेद फफूंद)',
      gu: 'ગંભીર (ઝૂમખાં અને પાન પર સફેદ ફૂગ)'
    },
    severityLevel: 'critical',
    symptoms: {
      en: 'Yellow oily translucent spots on upper leaf surface with white downy growth on the underside. Berries become brown and shrivel.',
      mr: 'पानांच्या वरच्या बाजूला तेलकट पिवळे डाग आणि खालच्या बाजूस पांढरी बुरशी वाढणे. मणी तपकिरी पडून वाळणे.',
      hi: 'पत्तियों के ऊपरी भाग पर तैलीय पीले धब्बे और नीचे सफेद फफूंद। अंगूर के दाने भूरे होकर सिकुड़ जाते हैं।',
      gu: 'પાનની ઉપર તેલ જેવા પીળા ડાઘ અને નીચે સફેદ ફૂગ. દ્રાક્ષના મણકા બદામી થઈ સંકોચાઈ જવા.'
    },
    organicRemedy: {
      en: 'Canopy management for air circulation. Spray Bacillus subtilis (3 ml/L) or potassium silicate (2 g/L) to strengthen cuticle.',
      mr: 'वेलींची हवा खेळती राहण्यासाठी छाटणी व्यवस्थापन. बॅसिलस सबटिलिस ३ मिली/लिटर किंवा पोटॅशियम सिलिकेट २ ग्रॅम/लिटर फवारावे.',
      hi: 'हवा के संचार के लिए छंटाई करें। बैसिलस सबटिलिस 3 मिली/लीटर अथवा पोटैशियम सिलिकेट 2 ग्राम/लीटर का छिड़काव करें।',
      gu: 'વેલાની છાંટણી કરી હવા ઉજાસ જાળવો. બેસિલસ સબટીલીસ ૩ મિલી/લીટર અથવા પોટેશિયમ સિલિકેટ ૨ ગ્રામ/લીટર છાંટો.'
    },
    chemicalRemedy: {
      en: 'Apply CIB&RC approved Dimethomorph 50% WP @ 1 g/L or Mandipropamid 23.4% SC @ 0.8 ml/L. Follow National Research Centre for Grapes export schedules.',
      mr: 'डायमेथोमॉर्फ ५०% WP १ ग्रॅम/लिटर किंवा मॅन्डिप्रोपॅमिड २३.४% SC ०.८ मिली/लिटर. राष्ट्रीय द्राक्ष संशोधन केंद्र (NRCG) वेळापत्रक पाळा.',
      hi: 'डाइमेथोमोर्फ 50% WP 1 ग्राम/लीटर या मैंडिप्रोपामिड 0.8 मिली/लीटर का उपयोग करें। राष्ट्रीय अंगूर अनुसंधान केंद्र दिशानिर्देश मानें।',
      gu: 'ડાયમેથોમોર્ફ ૫૦% WP ૧ ગ્રામ/લીટર અથવા મેન્ડિપ્રોપામિડ ૦.૮ મિલી/લીટર. રાષ્ટ્રીય દ્રાક્ષ સંશોધન કેન્દ્ર (NRCG) નું શિડ્યુલ અનુસરો.'
    },
    subsidyGuideline: {
      en: 'ICAR-National Research Centre for Grapes (NRCG) Pune Annexure-5 Export Compliance Guidelines.',
      mr: 'राष्ट्रीय द्राक्ष संशोधन केंद्र (NRCG) पुणे आणि महाराष्ट्र राज्य द्राक्ष बागायतदार संघ प्रमाणित.',
      hi: 'राष्ट्रीय अंगूर अनुसंधान केंद्र (NRCG) पुणे निर्यात अनुपालन दिशानिर्देश अनुसार।',
      gu: 'રાષ્ટ્રીય દ્રાક્ષ સંશોધન કેન્દ્ર (NRCG) પુણે નિકાસ ગુણવત્તા માપદંડ મુજબ.'
    }
  },

  banana: {
    crop: 'Banana',
    cropKey: 'banana',
    category: 'fruit',
    diseaseName: {
      en: 'Sigatoka Leaf Spot (Mycosphaerella musicola)',
      mr: 'केळीवरील सिगाटोका करपा रोग',
      hi: 'केले का सिगाटोका पत्ती धब्बा रोग',
      gu: 'કેળાંનો સિગાટોકા પાનનો સુકારો'
    },
    severity: {
      en: 'Moderate (Premature Leaf Necrosis)',
      mr: 'मध्यम (पाने सुकणे व घड लवकर पिकणे)',
      hi: 'मध्यम (पत्तियां सूखना व फल समय से पहले पकना)',
      gu: 'મધ્યમ (પાન સુકાવાં અને લૂમ વહેલી પાકી જવી)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Small chlorotic spots that enlarge into spindle-shaped brown streaks with grey centers and dark margins. Premature ripening of bunches.',
      mr: 'पानांवर सुरुवातीला पिवळसर बारीक ठिपके पडून नंतर लांबट करडे डाग तयार होणे. पाने सुकल्याने घड पूर्ण न भरता लवकर पिकणे.',
      hi: 'पत्तियों पर छोटे पीले धब्बे जो बढ़कर लंबे भूरे-धूसर धारियों में बदल जाते हैं, जिससे समय से पहले फल पकने लगते हैं।',
      gu: 'પાન પર નાના પીળા ડાઘ જે વધીને લાંબા બદામી-રાખોડી પટ્ટા બને છે, જેથી કેળાંની લૂમ અધૂરી ભરાયેલી વહેલી પાકે છે.'
    },
    organicRemedy: {
      en: 'De-leaf heavily infected leaves and burn outside orchard. Spray mineral oil / petroleum-based agricultural spray oil (10 ml/L) emulsified with mild soap.',
      mr: 'खालची वाळलेली आणि जास्त बाधित पाने कापून बागेबाहेर जाळावीत. मिनरल ऑइल १० मिली/लिटर साबणासह फवारावे.',
      hi: 'रोगग्रस्त सूखी पत्तियों को काटकर खेत से बाहर जलाएं। खनिज तेल 10 मिली/लीटर का छिड़काव करें।',
      gu: 'રોગવાળાં સૂકાં પાન કાપી બગીચા બહાર બાળો. મીનરલ ઓઇલ ૧૦ મિલી/લીટર સાબુના પાણી સાથે છાંટો.'
    },
    chemicalRemedy: {
      en: 'Apply Propiconazole 25% EC @ 1 ml/L or Pyraclostrobin 20% WG @ 1 g/L with non-ionic sticker at monthly intervals.',
      mr: 'प्रोपिकोनेझोल २५% EC १ मिली/लिटर किंवा पायरॅक्लोस्ट्रोबिन २०% WG १ ग्रॅम/लिटर स्टीकरसह फवारावे.',
      hi: 'प्रोपिकोनाजोल 25% EC 1 मिली/लीटर अथवा पाइराक्लोस्ट्रोबिन 20% WG 1 ग्राम/लीटर स्टीकर के साथ छिड़कें।',
      gu: 'પ્રોપિકોનાઝોલ ૨૫% EC ૧ મિલી/લીટર અથવા પાયરાક્લોસ્ટ્રોબિન ૨૦% WG ૧ ગ્રામ/લીટર સ્ટીકર સાથે છંટકાવ કરવો.'
    },
    subsidyGuideline: {
      en: 'Jalgaon Banana Export Zone & National Horticulture Board (NHB) disease surveillance advisory.',
      mr: 'जळगाव केळी निर्यात विभाग आणि राष्ट्रीय फलोत्पादन मंडळ (NHB) रोग नियंत्रण सल्ला.',
      hi: 'जलगांव केला निर्यात क्षेत्र एवं राष्ट्रीय बागवानी बोर्ड (NHB) निगरानी दिशा-निर्देश अनुसार।',
      gu: 'રાષ્ટ્રીય બાગાયત બોર્ડ (NHB) અને કેળાં ઉત્પાદક સંઘ માર્ગદર્શિકા મુજબ.'
    }
  },

  brinjal: {
    crop: 'Brinjal',
    cropKey: 'brinjal',
    category: 'vegetable',
    diseaseName: {
      en: 'Shoot & Fruit Borer (Leucinodes orbonalis) & Little Leaf',
      mr: 'वांग्यावरील शेंडा व फळ पोखरणारी अळी आणि पर्णगुच्छ',
      hi: 'बैंगन का तना एवं फल छेदक और लघु पर्ण रोग',
      gu: 'રીંગણની ડૂંખ અને ફળ કોરી ખાનાર ઇયળ'
    },
    severity: {
      en: 'Moderate to High (Shoot Drooping & Fruit Holes)',
      mr: 'मध्यम ते जास्त (शेंडे कोमेजणे व फळांना छिद्रे)',
      hi: 'मध्यम से गंभीर (तने का झुकना व फलों में छेद)',
      gu: 'મધ્યમથી વધારે (ડૂંખ નમી પડવી અને ફળમાં કાણાં)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Terminal shoots droop and wither. Larvae bore into developing fruits leaving holes plugged with excreta.',
      mr: 'झाडाचे कोवळे शेंडे वाळून लोंबकळतात. अळी फळात शिरून छिद्रे करते व विष्ठा बाहेर टाकते.',
      hi: 'पौधों के कोमल तने झुककर सूख जाते हैं। इल्ली फलों में छेद करके मल बाहर निकालती है।',
      gu: 'છોડની કુમળી ડૂંખો ચીમળાઈને નમી પડે છે. ઇયળ ફળમાં કાણું પાડી અંદરનો ગર ખાઈ જાય છે.'
    },
    organicRemedy: {
      en: 'Clip and destroy drooping shoots weekly. Install 10 pheromone traps (Lucin-lure) per acre. Spray Beauveria bassiana @ 5 g/L.',
      mr: 'सुकलेले शेंडे दर आठवड्याला कापून नष्ट करा. एकरी १० ल्युसिन-ल्यूर कामगंध सापळे लावा. ब्युव्हेरिया बॅसियाना ५ ग्रॅम/लिटर फवारा.',
      hi: 'मुरझाई हुई शाखाओं को हर हफ्ते काटकर नष्ट करें। 10 फेरोमोन ट्रैप प्रति एकड़ लगाएं। ब्युवेरिया बेसियाना 5 ग्राम/लीटर छिड़कें।',
      gu: 'ચીમળાયેલી ડૂંખો દર અઠવાડિયે કાપી નાખો. એકરે ૧૦ ફેરોમોન ટ્રેપ લગાવો. બ્યુવેરિયા બાસિયાના ૫ ગ્રામ/લીટર છાંટો.'
    },
    chemicalRemedy: {
      en: 'Apply Spinosad 45% SC @ 0.3 ml/L or Emamectin Benzoate 5% SG @ 0.4 g/L. Strictly observe 3-day harvest withholding period.',
      mr: 'स्पिनोसॅड ४५% SC ०.३ मिली/लिटर किंवा इमामेक्टिन बेन्झोएट ०.४ ग्रॅम/लिटर. फवारणीनंतर ३ दिवस फळे तोडू नयेत.',
      hi: 'स्पिनोसाड 45% SC 0.3 मिली/लीटर या इमामेक्टिन बेंजोएट 0.4 ग्राम/लीटर छिड़कें। फल तोड़ने से पहले 3 दिन का अंतर रखें।',
      gu: 'સ્પિનોસાડ ૪૫% SC ૦.૩ મિલી/લીટર અથવા ઇમામેક્ટીન બેન્ઝોએટ ૦.૪ ગ્રામ/લીટર છાંટો. ફળ તોડતાં પહેલાં ૩ દિવસનો ગાળો રાખો.'
    },
    subsidyGuideline: {
      en: 'Supported under State Vegetable Mission & Krishi Vigyan Kendra IPM Demonstration.',
      mr: 'राज्य भाजीपाला अभियान आणि कृषी विज्ञान केंद्र IPM प्रात्यक्षिक मार्गदर्शक.',
      hi: 'राज्य सब्जी मिशन एवं कृषि विज्ञान केंद्र आईपीएम प्रदर्शन दिशानिर्देश।',
      gu: 'રાજ્ય શાકભાજી મિશન અને કૃષિ વિજ્ઞાન કેન્દ્ર IPM ગાઇડલાઇન મુજબ.'
    }
  },

  chilli: {
    crop: 'Green Chilli',
    cropKey: 'chilli',
    category: 'vegetable',
    diseaseName: {
      en: 'Chilli Thrips & Murda Leaf Curl Complex',
      mr: 'मिरचीवरील चुरडा-मुरडा (थ्रिप्स व कोळी रोग)',
      hi: 'मिर्च का पत्ती मरोड़ रोग (थ्रिप्स व माइट्स)',
      gu: 'મરચીનો કોકડવો (ચૂરડો-મૂરડો / થ્રીપ્સ)'
    },
    severity: {
      en: 'Moderate to High (Boat-shaped Leaf Upcurling)',
      mr: 'मध्यम ते जास्त (पाने बोटीसारखी वर किंवा खाली वळणे)',
      hi: 'मध्यम से गंभीर (पत्तियां नाव की तरह मुड़ना)',
      gu: 'મધ્યમથી વધારે (પાન હોડી જેવાં વળી જવાં)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Leaves curl upwards into boat-shapes from thrips rasps; downward curling occurs from mite feeding. Plants become stunted and bronzed.',
      mr: 'थ्रिप्समुळे पाने बोटीसारखी वर वळतात, तर कोळीमुळे खाली वळतात. झाडांची वाढ खुंटते आणि चुरडा पडतो.',
      hi: 'थ्रिप्स के कारण पत्तियां नाव की तरह ऊपर मुड़ती हैं और माइट्स के कारण नीचे मुड़ती हैं। पौधों का विकास रुक जाता है।',
      gu: 'થ્રીપ્સથી પાન હોડી જેવાં ઉપર વળે છે અને માઇટ્સથી નીચે વળે છે. છોડનો વિકાસ અટકી જાય છે.'
    },
    organicRemedy: {
      en: 'Install blue sticky traps (15/acre) for thrips and yellow traps for whiteflies. Spray 5% Dashparni Ark or Neem oil @ 5 ml/L.',
      mr: 'एकरी १५ निळे चिकट सापळे लावा. ५% दशपर्णी अर्क किंवा कडुलिंब तेल ५ मिली/लिटर फवारावे.',
      hi: 'प्रति एकड़ 15 नीले चिपचिपे ट्रैप लगाएं। 5% दशपर्णी अर्क अथवा नीम तेल 5 मिली/लीटर छिड़कें।',
      gu: 'એકરે ૧૫ વાદળી સ્ટીકી ટ્રેપ લગાવો. ૫% દશપર્ણી અર્ક અથવા લીમડાનું તેલ ૫ મિલી/લીટર છાંટો.'
    },
    chemicalRemedy: {
      en: 'Apply Fipronil 5% SC @ 1.5 ml/L or Diafenthiuron 50% WP @ 1.2 g/L. Alternate active ingredients to avoid resistance.',
      mr: 'फिप्रोनिल ५% SC १.५ मिली/लिटर किंवा डायाफेन्थिरॉन ५०% WP १.२ ग्रॅम/लिटर. कीटकनाशके आलटून-पालटून वापरावीत.',
      hi: 'फिप्रोनिल 5% SC 1.5 मिली/लीटर या डायाफेंथियूरॉन 1.2 ग्राम/लीटर का छिड़काव करें। दवाओं को बदल-बदल कर उपयोग करें।',
      gu: 'ફિપ્રોનિલ ૫% SC ૧.૫ મિલી/લીટર અથવા ડાયાફેન્થિયુરોન ૧.૨ ગ્રામ/લીટર છાંટો. દવાઓ અદલબદલ કરીને વાપરો.'
    },
    subsidyGuideline: {
      en: 'National Horticulture Mission (NHM) Spice & Vegetable crop protection protocol.',
      mr: 'राष्ट्रीय फलोत्पादन अभियान (मसाला व भाजीपाला पिके) सल्लागार प्रणाली.',
      hi: 'राष्ट्रीय बागवानी मिशन (मसाला व सब्जी फसलें) सुरक्षा प्रोटोकॉल के तहत।',
      gu: 'રાષ્ટ્રીય બાગાયત મિશન (મસાલા અને શાકભાજી) સંરક્ષણ કાર્યક્રમ મુજબ.'
    }
  },

  groundnut: {
    crop: 'Groundnut',
    cropKey: 'groundnut',
    category: 'oilseed',
    diseaseName: {
      en: 'Tikka Disease / Leaf Spot (Cercospora personata)',
      mr: 'भुईमुगावरील टिक्का रोग (तांबडे-काळे ठिपके)',
      hi: 'मूंगफली का टिक्का रोग (पत्ती धब्बा)',
      gu: 'મગફળીનો ટિક્કા રોગ (કાબરો / પાનનાં ટપકાં)'
    },
    severity: {
      en: 'Moderate (Circular Dark Spots with Yellow Rim)',
      mr: 'मध्यम (पानांवर पिवळ्या कडेसह काळे ठिपके)',
      hi: 'मध्यम (पत्तियों पर पीले घेरे वाले काले धब्बे)',
      gu: 'મધ્યમ (પીળી કિનારીવાળા કાળા ડાઘ)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Circular dark brown to black spots with bright yellow haloes on upper leaf surfaces. Causes severe defoliation during pod development.',
      mr: 'पानांच्या वरच्या भागावर पिवळ्या वलयाचे गोलाकार काळे ठिपके पडणे. शेंगा भरण्याच्या काळात पाने गळतात.',
      hi: 'पत्तियों पर पीले छल्ले वाले गहरे काले-भूरे धब्बे। फलियां बनते समय पत्तियां झड़ने लगती हैं।',
      gu: 'પાનની ઉપર પીળી રીંગવાળા ગોળાકાર કાળા ડાઘ પડવા. શિંગો બેસવાના સમયે પાન ખરી પડે છે.'
    },
    organicRemedy: {
      en: 'Seed treatment with Trichoderma viride @ 5 g/kg seed. Spray 5% cow urine + ginger-garlic extract at 40 and 60 days after sowing.',
      mr: 'पेरणीपूर्वी ट्रायकोडर्मा ५ ग्रॅम/किलो बीजप्रक्रिया. पेरणीनंतर ४० व ६० दिवसांनी गोमूत्र व आले-लसूण अर्क फवारावा.',
      hi: 'ट्राइकोडर्मा (5 ग्राम/किग्रा) से बीजोपचार करें। बुवाई के 40 और 60 दिन बाद गोमूत्र और अदरक-लहसुन अर्क का छिड़काव करें।',
      gu: 'વાવણી પહેલાં ટ્રાઇકોડર્મા ૫ ગ્રામ/કિલોથી બીજ માવજત. ગૌમૂત્ર અને આદુ-લસણનો અર્ક ૪૦ અને ૬૦ દિવસે છાંટો.'
    },
    chemicalRemedy: {
      en: 'Apply Carbendazim 12% + Mancozeb 63% WP @ 2 g/L or Hexaconazole 5% EC @ 2 ml/L at initial symptom onset.',
      mr: 'कार्बेंडाझिम १२% + मँकोझेब ६३% WP २ ग्रॅम/लिटर किंवा हेक्साकोनॅझोल २ मिली/लिटर फवारावे.',
      hi: 'कार्बेन्डाजिम 12% + मैंकोजेब 63% WP 2 ग्राम/लीटर अथवा हेक्साकोनाजोल 2 मिली/लीटर का छिड़काव करें।',
      gu: 'કાર્બેન્ડાઝીમ ૧૨% + મેન્કોઝેબ ૬૩% WP ૨ ગ્રામ/લીટર અથવા હેક્સાકોનાઝોલ ૨ મિલી/લીટર છાંટો.'
    },
    subsidyGuideline: {
      en: 'ICAR-Directorate of Groundnut Research (DGR) Junagadh & National Mission on Oilseeds (NMOOP).',
      mr: 'भारतीय भुईमूग संशोधन संचनालय (DGR) आणि राष्ट्रीय तेलबिया अभियान (NMOOP) शिफारशी.',
      hi: 'राष्ट्रीय तिलहन मिशन (NMOOP) एवं मूंगफली अनुसंधान निदेशालय जूनागढ़ के दिशा-निर्देश।',
      gu: 'રાષ્ટ્રીય તેલીબિયાં મિશન (NMOOP) અને મગફળી સંશોધન નિયામક કચેરી જૂનાગઢ મુજબ.'
    }
  },

  chickpea: {
    crop: 'Chickpea (Gram)',
    cropKey: 'chickpea',
    category: 'pulse',
    diseaseName: {
      en: 'Fusarium Wilt & Pod Borer (Helicoverpa armigera)',
      mr: 'हरभऱ्यावरील मर रोग व घाटे अळी',
      hi: 'चने का उकठा (विल्ट) एवं फली छेदक कीट',
      gu: 'ચણાનો સુકારો (ઉકઠા) અને ઘેટીની ઇયળ'
    },
    severity: {
      en: 'Moderate to High (Drooping Leaves & Hollow Pods)',
      mr: 'मध्यम ते जास्त (झाडे सुकणे व घाट्यांना छिद्रे)',
      hi: 'मध्यम से गंभीर (पौधों का सूखना व फलियों में छेद)',
      gu: 'મધ્યમથી વધારે (છોડ સુકાઈ જવો અને ઘેટીમાં કાણાં)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Leaves droop and turn dull yellow; vascular xylem turns brown. Pod borer caterpillars bore head into pods to feed on seeds.',
      mr: 'झाडांची पाने निस्तेज होऊन वाळणे, मूळ चिरल्यास काळी रेघ दिसणे. घाटे अळी घाट्याला छिद्र करून दाणे खाते.',
      hi: 'पत्तियां मुरझाकर पीली पड़ जाती हैं, तना चीरने पर अंदर भूरी नसें दिखती हैं। इल्ली फली में सिर डालकर दाने खाती है।',
      gu: 'પાન ચીમળાઈને પીળાં પડી જાય છે, થડ ચીરતાં અંદર બદામી પટ્ટો દેખાય છે. ઇયળ ઘેટીમાં કાણું પાડી દાણા ખાય છે.'
    },
    organicRemedy: {
      en: 'Seed treatment with Trichoderma asperellum (10 g/kg). Install bird perches (20/acre) and 8 pheromone traps per acre.',
      mr: 'पेरणीपूर्वी ट्रायकोडर्मा १० ग्रॅम/किलो चोळावे. शेतात एकरी २० पक्षी थांबे लावावेत आणि ८ कामगंध सापळे लावा.',
      hi: 'ट्राइकोडर्मा 10 ग्राम/किग्रा से बीजोपचार करें। खेत में प्रति एकड़ 20 पक्षी बसेरे और 8 फेरोमोन ट्रैप लगाएं।',
      gu: 'વાવણી પહેલાં ટ્રાઇકોડર્મા ૧૦ ગ્રામ/કિલોથી બીજ માવજત. ખેતરમાં પક્ષીઓ બેસવા માટે લાકડીઓ અને ૮ ફેરોમોન ટ્રેપ લગાવો.'
    },
    chemicalRemedy: {
      en: 'For pod borer: Emamectin Benzoate 5% SG @ 0.4 g/L or Chlorantraniliprole 18.5% SC @ 0.3 ml/L at 50% flowering stage.',
      mr: 'घाटे अळीसाठी इमामेक्टिन बेन्झोएट ०.४ ग्रॅम/लिटर किंवा क्लोराँट्रानिलीप्रोल ०.३ मिली/लिटर ५०% फुलकळी अवस्थेत फवारावे.',
      hi: 'फली छेदक हेतु: इमामेक्टिन बेंजोएट 0.4 ग्राम/लीटर या क्लोरांट्रानिलीप्रोल 0.3 मिली/लीटर 50% फूल आने पर छिड़कें।',
      gu: 'ઘેટીની ઇયળ માટે: ઇમામેક્ટીન બેન્ઝોએટ ૦.૪ ગ્રામ/લીટર અથવા ક્લોરાન્ટ્રાનિલીપ્રોલ ૦.૩ મિલી/લીટર ૫૦% ફૂલ વખતે છાંટો.'
    },
    subsidyGuideline: {
      en: 'National Food Security Mission - Pulses (NFSM-Pulses) certified cluster demonstration.',
      mr: 'राष्ट्रीय अन्न सुरक्षा अभियान - कडधान्य (NFSM) गट प्रात्यक्षिक मार्गदर्शक.',
      hi: 'राष्ट्रीय खाद्य सुरक्षा मिशन - दलहन (NFSM) क्लस्टर प्रदर्शन योजना अंतर्गत।',
      gu: 'રાષ્ટ્રીય ખાદ્ય સુરક્ષા મિશન - કઠોળ (NFSM Pulses) યોજના હેઠળ.'
    }
  },

  tur: {
    crop: 'Pigeon Pea (Tur)',
    cropKey: 'tur',
    category: 'pulse',
    diseaseName: {
      en: 'Phytophthora Stem Blight & Pod Fly',
      mr: 'तुरीवरील खोड करपा व शेंगमाशी',
      hi: 'अरहर का तना झुलसा एवं फली मक्खी',
      gu: 'તુવેરનો થડનો સુકારો અને શિંગમાખી'
    },
    severity: {
      en: 'Moderate (Brown Girdling Lesions on Main Stem)',
      mr: 'मध्यम (खोडावर काळे पट्टे येऊन फांद्या मोडणे)',
      hi: 'मध्यम (तने पर काले धब्बे व शाखाएं टूटना)',
      gu: 'મધ્યમ (થડ પર કાળા ડાઘ અને ડાળીઓ તૂટી જવી)'
    },
    severityLevel: 'moderate',
    symptoms: {
      en: 'Dark brown to black lesions girdling the main stem near soil line, causing sudden plant wilting during heavy rains.',
      mr: 'जमिनीलगतच्या खोडावर काळे चट्टे पडून खोड कुजणे, पाऊस जास्त झाल्यावर अचानक झाड वाळणे.',
      hi: 'जमीन के पास मुख्य तने पर काले-भूरे धब्बे जिससे पौधा भारी बारिश के बाद अचानक सूख जाता है।',
      gu: 'જમીન પાસેના થડ પર કાળા-બદામી ડાઘ થવા અને વધુ વરસાદ પછી છોડ એકાએક સુકાઈ જવો.'
    },
    organicRemedy: {
      en: 'Ensure broad bed and furrow (BBF) drainage. Treat seed with Trichoderma harzianum @ 10 g/kg + Rhizobium culture.',
      mr: 'रुंद वरंबा-सरी (BBF) पद्धतीने निचरा सुधारा. ट्रायकोडर्मा १० ग्रॅम + रायझोबियम जिवाणू संवर्धक बीजप्रक्रिया करावी.',
      hi: 'उचित जल निकासी (BBF विधि) बनाएं। ट्राइकोडर्मा 10 ग्राम/किग्रा + राइजोबियम से बीजोपचार करें।',
      gu: 'ખેતરમાંથી પાણીનો નિકાલ સારો રાખો. વાવણી વખતે ટ્રાઇકોડર્મા ૧૦ ગ્રામ + રાઇઝોબિયમથી બીજ માવજત કરો.'
    },
    chemicalRemedy: {
      en: 'Drench root zone with Metalaxyl-M 4% + Mancozeb 64% WP @ 2.5 g/L at early symptom stage. Avoid water logging.',
      mr: 'सुरुवातीला मेटालॅक्सिल ४% + मँकोझेब ६४% WP २.५ ग्रॅम/लिटर झाडाच्या बुंध्याशी ओतावे.',
      hi: 'शुरुआती लक्षण दिखते ही मेटालैक्सिल + मैंकोजेब 2.5 ग्राम/लीटर घोल को तने की जड़ में डालें।',
      gu: 'લક્ષણો દેખાય કે તરત મેટાલેક્સિલ + મેન્કોઝેબ ૨.૫ ગ્રામ/લીટર થડના મૂળિયાં પાસે રેડો.'
    },
    subsidyGuideline: {
      en: 'Mahatma Phule Krishi Vidyapeeth (MPKV) Rahuri Pulse Improvement Advisory.',
      mr: 'महात्मा फुले कृषी विद्यापीठ (MPKV) राहुरी कडधान्य संशोधन शिफारशी.',
      hi: 'राज्य कृषि विश्वविद्यालय दलहन सुधार परियोजना दिशा-निर्देश।',
      gu: 'રાજ્ય કૃષિ યુનિવર્સિટી કઠોળ સંશોધન ભલામણ અનુસાર.'
    }
  }
};

/**
 * Loads the active supported crop list.
 * Merges backend crops from /api/markets/crops with the authoritative agricultural catalog.
 *
 * @returns {Promise<Array>}
 */
export async function loadSupportedCrops() {
  try {
    const apiCrops = await fetchCrops();
    if (Array.isArray(apiCrops) && apiCrops.length > 0) {
      // Map API crops to rich catalog items
      const mergedMap = new Map();

      // Add authoritative catalog first
      for (const crop of AUTHORITATIVE_CROPS) {
        mergedMap.set(crop.nameEn.toLowerCase(), crop);
      }

      // Merge API crops
      for (const apiCrop of apiCrops) {
        const enName = apiCrop.name || apiCrop.name_en || apiCrop.nameEn;
        if (!enName) continue;
        const key = enName.toLowerCase();
        const existing = mergedMap.get(key);
        if (existing) {
          mergedMap.set(key, {
            ...existing,
            id: existing.id || String(apiCrop.id),
            nameMr: existing.nameMr || apiCrop.name_mr,
            nameHi: existing.nameHi || apiCrop.name_hi,
            nameGu: existing.nameGu || apiCrop.name_gu,
            category: existing.category || apiCrop.category || 'vegetable'
          });
        } else {
          mergedMap.set(key, {
            id: String(apiCrop.id || key),
            nameEn: enName,
            nameMr: apiCrop.name_mr || enName,
            nameHi: apiCrop.name_hi || enName,
            nameGu: apiCrop.name_gu || enName,
            category: apiCrop.category || 'vegetable'
          });
        }
      }

      return Array.from(mergedMap.values());
    }
  } catch (err) {
    // Graceful fallback to authoritative catalog
  }

  return [...AUTHORITATIVE_CROPS];
}

/**
 * Retrieves the pathology guide for a chosen crop.
 * If the crop is supported, returns the genuine pathology guide.
 * If unsupported, returns a transparent unsupported status with safe recommendations.
 *
 * @param {string} cropKey - Crop identifier or name
 * @returns {Object} Pathology diagnostic guide
 */
export function getPathologyGuide(cropKey = 'tomato') {
  const normalizedKey = String(cropKey).toLowerCase().replace(/[^a-z]/g, '');

  // Look for direct key match or aliases
  const matchedKey = Object.keys(CROP_PATHOLOGY_RECORDS).find((k) => {
    return normalizedKey.includes(k) || k.includes(normalizedKey);
  });

  if (matchedKey && CROP_PATHOLOGY_RECORDS[matchedKey]) {
    return {
      isSupported: true,
      ...CROP_PATHOLOGY_RECORDS[matchedKey]
    };
  }

  // Safe fallback for custom or unlisted crop
  return {
    isSupported: false,
    crop: cropKey,
    cropKey: normalizedKey,
    diseaseName: {
      en: 'No Direct Pathology Record in Reference Catalog',
      mr: 'संदर्भ सूचीमध्ये थेट रोग नोंद उपलब्ध नाही',
      hi: 'संदर्भ सूची में सीधा रोग रिकॉर्ड उपलब्ध नहीं है',
      gu: 'સંદર્ભ યાદીમાં સીધો રોગ રેકોર્ડ ઉપલબ્ધ નથી'
    },
    severity: {
      en: 'Unspecified — Field agronomist confirmation required',
      mr: 'अनिर्दिष्ट — शेततज्ज्ञांची प्रत्यक्ष तपासणी आवश्यक',
      hi: 'अनिर्दिष्ट — कृषि वैज्ञानिक द्वारा प्रत्यक्ष जांच आवश्यक',
      gu: 'અનિર્દિષ્ટ — કૃષિ નિષ્ણાત દ્વારા સીધી તપાસ જરૂરી'
    },
    severityLevel: 'unknown',
    symptoms: {
      en: 'This crop is outside HarvestMitra\'s verified photographic diagnostic catalog. We do not invent unsupported diagnoses.',
      mr: 'हे पीक हार्वेस्टमित्राच्या पडताळणी केलेल्या थेट संदर्भ सूचीबाहेर आहे. आम्ही असत्य किंवा अंदाजपंचे निदान दाखवत नाही.',
      hi: 'यह फसल हार्वेस्टमित्रा की सत्यापित संदर्भ सूची से बाहर है। हम मनगढ़ंत निदान प्रस्तुत नहीं करते हैं।',
      gu: 'આ પાક હાર્વેસ્ટમિત્રાની ચકાસાયેલ સંદર્ભ યાદી બહાર છે. અમે અપ્રમાણિત કે ખોટું નિદાન દર્શાવતા નથી.'
    },
    organicRemedy: {
      en: 'Practice general preventive crop hygiene: Maintain soil aeration, avoid over-watering, and install yellow/blue sticky traps.',
      mr: 'सर्वसाधारण प्रतिबंधात्मक उपाय: शेतात पाण्याचा निचरा योग्य ठेवा, अवाजवी पाणी टाळा, आणि चिकट सापळे वापरा.',
      hi: 'सामान्य सुरक्षात्मक उपाय: खेत में जल निकासी दुरुस्त रखें, अधिक पानी न दें, और चिपचिपे जाल लगाएं।',
      gu: 'સામાન્ય સાવચેતીનાં પગલાં: ખેતરમાં યોગ્ય પાણી નિકાલ રાખો, વધુ પાણી ન આપો, અને સ્ટીકી ટ્રેપ લગાવો.'
    },
    chemicalRemedy: {
      en: 'Do not apply unverified chemicals without laboratory plant leaf test and certified university prescription.',
      mr: 'कृषी विद्यापीठाच्या किंवा तज्ज्ञांच्या अधिकृत सल्ल्याशिवाय कोणतेही रासायनिक औषध फवारू नका.',
      hi: 'कृषि वैज्ञानिक अथवा कृषि केंद्र के आधिकारिक परामर्श के बिना किसी भी रसायन का छिड़काव न करें।',
      gu: 'કૃષિ યુનિવર્સિટી કે નિષ્ણાતોની અધિકૃત સલાહ વિના કોઈ પણ રાસાયણિક દવા ન છાંટો.'
    },
    subsidyGuideline: {
      en: 'Please share your leaf photo and query with Mitra AI chatbot or visit your nearest Taluka Krishi Bhavan or KVK.',
      mr: 'कृपया आपला फोटो किंवा प्रश्न मित्रा AI चॅटबॉटला विचारा किंवा जवळच्या तालुका कृषी कार्यालयात संपर्क करा.',
      hi: 'कृपया अपने पत्ते का फोटो अथवा प्रश्न मित्रा AI चैटबॉट से पूछें अथवा नजदीकी कृषि विज्ञान केंद्र से संपर्क करें।',
      gu: 'કૃપા કરીને તમારા પાનનો ફોટો અથવા પ્રશ્ન મિત્રા AI ચેટબોટને પૂછો અથવા નજીકના તાલુકા કૃષિ ભવનનો સંપર્ક કરો.'
    }
  };
}

/**
 * Builds localized text for speech reading
 */
export function buildPrescriptionSpeechText(guide, language = 'en') {
  if (!guide) return '';
  const lang = ['mr', 'hi', 'gu', 'en'].includes(language) ? language : 'en';

  const disease = guide.diseaseName?.[lang] || guide.diseaseName?.en || '';
  const severity = guide.severity?.[lang] || guide.severity?.en || '';
  const organic = guide.organicRemedy?.[lang] || guide.organicRemedy?.en || '';
  const chemical = guide.chemicalRemedy?.[lang] || guide.chemicalRemedy?.en || '';

  if (lang === 'mr') {
    return `पीक: ${guide.crop}. रोग निदान: ${disease}. तीव्रता: ${severity}. जैविक आणि सेंद्रिय उपाय: ${organic}. एकात्मिक कीड व्यवस्थापन: ${chemical}.`;
  }
  if (lang === 'hi') {
    return `फसल: ${guide.crop}. रोग निदान: ${disease}. तीव्रता: ${severity}. जैविक उपाय: ${organic}. एकीकृत कीट प्रबंधन: ${chemical}.`;
  }
  if (lang === 'gu') {
    return `પાક: ${guide.crop}. રોગ નિદાન: ${disease}. તીવ્રતા: ${severity}. જૈવિક ઉપાય: ${organic}. સંકલિત જીવાત નિયંત્રણ: ${chemical}.`;
  }
  return `Crop: ${guide.crop}. Diagnostic: ${disease}. Severity: ${severity}. Biological Management: ${organic}. Integrated Pest Guidance: ${chemical}.`;
}
