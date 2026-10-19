/**
 * fallbackEngine.js
 * Deterministic Rule-Based Fallback Engine for Mitra Assistant
 * HarvestMitra AI - ISSUE-09
 */

const { normalizeLanguage } = require('./intentDetector');

/**
 * Generate a deterministic, rule-based response without calling any external LLM
 *
 * @param {Object} params
 * @param {string} params.intent - Detected intent
 * @param {string} params.language - 'en' | 'hi' | 'gu'
 * @param {Object} params.context - Structured backend context
 * @param {string} [params.userMessage] - Original user message
 * @returns {Object} Normalized response
 */
function generateResponse(params = {}) {
  const {
    intent = 'unknown',
    language: rawLang = 'en',
    context = {},
    userMessage = ''
  } = params;

  const lang = normalizeLanguage(rawLang);
  let replyMessage = '';

  switch (intent) {
    case 'market_price':
      replyMessage = handleMarketPrice(context, lang);
      break;

    case 'harvest_decision':
      replyMessage = handleHarvestDecision(context, lang);
      break;

    case 'revenue_calculation':
      replyMessage = handleRevenueCalculation(context, lang, userMessage);
      break;

    case 'transport':
      replyMessage = handleTransport(context, lang);
      break;

    case 'weather':
      replyMessage = handleWeather(context, lang);
      break;

    case 'government_scheme':
      replyMessage = handleGovernmentScheme(context, lang, userMessage);
      break;

    case 'profile':
      replyMessage = handleProfile(context, lang);
      break;

    case 'help':
    case 'general_farming':
    case 'unknown':
    default:
      replyMessage = handleHelp(context, lang);
      break;
  }

  return {
    success: true,
    provider: 'fallback',
    mode: 'fallback',
    message: replyMessage,
    metadata: {
      intent,
      language: lang
    }
  };
}

const CROP_TRANSLATIONS = {
  tomato: { mr: 'टोमॅटो', hi: 'टमाटर', gu: 'ટામેટાં', en: 'Tomato' },
  onion: { mr: 'कांदा', hi: 'प्याज', gu: 'ડુંગળી', en: 'Onion' },
  potato: { mr: 'बटाटा', hi: 'आलू', gu: 'બટાકા', en: 'Potato' },
  wheat: { mr: 'गहू', hi: 'गेहूं', gu: 'ઘઉં', en: 'Wheat' },
  cotton: { mr: 'कापूस', hi: 'कपास', gu: 'કપાસ', en: 'Cotton' },
  soybean: { mr: 'सोयाबीन', hi: 'सोयाबीन', gu: 'સોયાબીન', en: 'Soybean' }
};

function getLocalizedCropName(name, lang) {
  if (!name) return lang === 'mr' ? 'पिकाचा' : lang === 'hi' ? 'फसल' : lang === 'gu' ? 'પાક' : 'crop';
  const key = String(name).toLowerCase();
  const found = CROP_TRANSLATIONS[key];
  if (found && found[lang]) return found[lang];
  return name;
}

/**
 * Handle market_price intent
 */
function handleMarketPrice(context, lang) {
  const market = context.marketData?.currentMarket;
  const cropName = context.crop?.name || 'crop';

  if (!market || market.pricePerKg === null || market.pricePerKg === undefined) {
    if (lang === 'mr') {
      return `माझ्याकडे सध्या तुमच्या निवडलेल्या क्षेत्रासाठी पडताळणी केलेले बाजार भाव उपलब्ध नाहीत. कृपया उपलब्ध माहिती पाहण्यासाठी Market Explorer उघडा.`;
    }
    if (lang === 'gu') {
      return `મારી પાસે અત્યારે તમારા પસંદ કરેલા વિસ્તાર માટે ચકાસાયેલ મંડી ભાવ ઉપલબ્ધ નથી. કૃપા કરીને ઉપલબ્ધ માહિતી જોવા માટે Market Explorer ખોલો.`;
    }
    if (lang === 'hi') {
      return `मेरे पास अभी आपके चयनित स्थान के लिए सत्यापित मंडी भाव उपलब्ध नहीं है। कृपया उपलब्ध डेटा देखने के लिए Market Explorer खोलें।`;
    }
    return `I don't have a verified market price for your selected location right now. Please open Market Explorer to check available data.`;
  }

  const isDemo = String(market.sourceType || '').toUpperCase().includes('DEMO');
  const demoNoteEn = isDemo ? ' based on available demonstration data' : '';
  const demoNoteHi = isDemo ? ' (उपलब्ધ डेमो डेटा के आधार पर)' : '';
  const demoNoteGu = isDemo ? ' (ઉપલબ્ધ ડેમો ડેટા અનુસાર)' : '';

  const demoNoteMr = isDemo ? ' (उपलब्ध डेमो डेटावर आधारित)' : '';

  if (lang === 'mr') {
    return `${market.name} मध्ये ${cropName} चा भाव ₹${market.pricePerKg}/${market.unit} आहे${demoNoteMr}। अधिक माहितीसाठी आपण Market Explorer पाहू शकता.`;
  }
  if (lang === 'gu') {
    return `${market.name} માં ${cropName} નો ભાવ ₹${market.pricePerKg}/${market.unit} છે${demoNoteGu}. વધુ વિગતો માટે તમે Market Explorer ચકાસી શકો છો.`;
  }
  if (lang === 'hi') {
    return `${market.name} में ${cropName} का भाव ₹${market.pricePerKg}/${market.unit} है${demoNoteHi}। अधिक विवरण के लिए आप Market Explorer देख सकते हैं।`;
  }
  return `${cropName} price at ${market.name} is ₹${market.pricePerKg}/${market.unit}${demoNoteEn}.`;
}

/**
 * Handle harvest_decision intent
 */
function handleHarvestDecision(context, lang) {
  const calc = context.calculations;

  if (calc && calc.today) {
    const todayNet = calc.today.netRevenue ?? calc.today.net_revenue;
    const altNet = calc.alternativeMarket?.netRevenue ?? calc.alternativeMarket?.net_revenue;

    if (lang === 'mr') {
      let msg = `सिस्टमने केलेल्या हिशोबानुसार, आज विक्री केल्यास अंदाजे निव्वळ नफा ₹${Number(todayNet).toLocaleString('en-IN')} आहे.`;
      if (altNet !== undefined && altNet !== null) {
        msg += ` पर्यायी बाजारपेठेत वाहतूक खर्च वजा जाता अंदाजे ₹${Number(altNet).toLocaleString('en-IN')} निव्वळ नफा मिळू शकतो.`;
      }
      msg += ` हा अंदाज आपण दिलेल्या माहितीवर आधारित आहे.`;
      return msg;
    }

    if (lang === 'gu') {
      let msg = `સિસ્ટમ દ્વારા કરવામાં આવેલી ગણતરી મુજબ, આજે વેચવાથી અંદાજિત ચોખ્ખો નફો ₹${Number(todayNet).toLocaleString('en-IN')} છે.`;
      if (altNet !== undefined && altNet !== null) {
        msg += ` વૈકલ્પિક મંડીમાં પરિવહન ખર્ચ બાદ કરતાં અંદાજે ₹${Number(altNet).toLocaleString('en-IN')} ચોખ્ખો નફો થઈ શકે છે.`;
      }
      msg += ` આ અંદાજ તમારા દ્વારા દાખલ કરેલ ધારણાઓ પર આધારિત છે.`;
      return msg;
    }

    if (lang === 'hi') {
      let msg = `सिस्टम द्वारा की गई गणना के अनुसार, आज बेचने पर अनुमानित शुद्ध कमाई ₹${Number(todayNet).toLocaleString('en-IN')} है।`;
      if (altNet !== undefined && altNet !== null) {
        msg += ` वैकल्पिक मंडी में परिवहन खर्च घटाने के बाद अनुमानित ₹${Number(altNet).toLocaleString('en-IN')} शुद्ध कमाई हो सकती है।`;
      }
      msg += ` ये अनुमान आपके द्वारा दर्ज की गई जानकारी पर आधारित हैं।`;
      return msg;
    }

    let msg = `According to the current calculation, selling today has an estimated net revenue of ₹${Number(todayNet).toLocaleString('en-IN')}.`;
    if (altNet !== undefined && altNet !== null) {
      msg += ` The alternative market estimates ₹${Number(altNet).toLocaleString('en-IN')} after transport expenses.`;
    }
    msg += ` These are estimates based on the values entered.`;
    return msg;
  }

  // If market data is available, provide current price and harvest holding advice
  const market = context.marketData?.currentMarket;
  const cropName = context.crop?.name;

  if (market && market.pricePerKg !== null && market.pricePerKg !== undefined) {
    const isDemo = String(market.sourceType || '').toUpperCase().includes('DEMO');
    const demoNoteHi = isDemo ? ' (उपलब्ध मंडी डेटा अनुसार)' : '';
    const demoNoteMr = isDemo ? ' (उपलब्ध बाजार डेटावर आधारित)' : '';
    const demoNoteGu = isDemo ? ' (ઉપલબ્ધ મંડી ડેટા અનુસાર)' : '';
    const demoNoteEn = isDemo ? ' (based on available APMC data)' : '';

    if (lang === 'hi') {
      return `वर्तमान में ${market.name} में ${cropName ? 'टमाटर' : 'फसल'} का भाव ₹${market.pricePerKg}/${market.unit || 'kg'} है${demoNoteHi}। यदि मौसम साफ है और बारिश की चेतावनी नहीं है, तो आप 3-5 दिन रोककर (hold) बेहतर भाव की प्रतीक्षा कर सकते हैं। सटीक गणना के लिए Harvest Decision Simulator में अपनी फसल मात्रा (किलो) दर्ज करके 3 विकल्पों की तुलना देखें।`;
    }
    if (lang === 'mr') {
      return `सध्या ${market.name} मध्ये ${cropName ? 'टोमॅटो' : 'पिकाचा'} भाव ₹${market.pricePerKg}/${market.unit || 'kg'} आहे${demoNoteMr}। हवामान अनुकूल असल्यास आणि पाऊस नसेल तर 3-5 दिवस पिकाची साठवणूक करून चांगला भाव मिळू शकतो. अचूक हिशोबासाठी Harvest Decision Simulator चा वापर करा.`;
    }
    if (lang === 'gu') {
      return `હાલમાં ${market.name} માં ${cropName ? 'ટામેટાં' : 'પાક'} નો ભાવ ₹${market.pricePerKg}/${market.unit || 'kg'} છે${demoNoteGu}. હવામાન સાનુકૂળ હોય અને વરસાદ ન હોય તો તમે ૩-૫ દિવસ માલ રોકીને વધુ સારો ભાવ મેળવી શકો છો. સચોટ ગણતરી માટે Harvest Decision Simulator નો ઉપયોગ કરો.`;
    }
    return `Current rate at ${market.name} is ₹${market.pricePerKg}/${market.unit || 'kg'}${demoNoteEn}. If weather conditions are clear without rain advisory, holding produce for 3-5 days can often yield higher net returns. Use the Harvest Decision Simulator to compare selling today vs holding based on your exact harvest quantity.`;
  }

  // If no calculation exists in context
  if (lang === 'mr') {
    return `काढणीचा योग्य निर्णय घेण्यासाठी कृपया पिकाचे प्रमाण (किलो) आणि बाजार भाव सांगा, किंवा 3 पर्यायांची तुलना पाहण्यासाठी Harvest Decision Simulator चा वापर करा.`;
  }
  if (lang === 'gu') {
    return `લણણીનો નિર્ણય લેવા માટે કૃપા કરીને પાકનું પ્રમાણ (કિલો) અને મંડી ભાવ જણાવો, અથવા Harvest Decision Simulator નો ઉપયોગ કરીને 3 વિકલ્પોની સરખામણી જુઓ.`;
  }
  if (lang === 'hi') {
    return `कटाई का सही निर्णय लेने के लिए कृपया फसल की मात्रा (किलो) और मंडी भाव बताएं, या Harvest Decision Simulator का उपयोग करके 3 विकल्पों की तुलना देखें।`;
  }
  return `To help with your harvest decision, please provide the crop quantity (kg) and mandi price, or use the Harvest Simulator to compare your selling options.`;
}

/**
 * Handle revenue_calculation intent
 */
function handleRevenueCalculation(context, lang, userMessage) {
  const calc = context.calculations;

  // If calculation is already supplied by backend
  if (calc && calc.today) {
    const gross = calc.today.grossRevenue ?? calc.today.gross_revenue;
    const expenses = calc.today.totalCost ?? calc.today.expenses;
    const net = calc.today.netRevenue ?? calc.today.net_revenue;

    if (lang === 'mr') {
      return `सिस्टमने केलेल्या हिशोबानुसार, अंदाजे एकूण उत्पन्न ₹${Number(gross).toLocaleString('en-IN')} आहे, एकूण खर्च ₹${Number(expenses).toLocaleString('en-IN')} आहे, आणि अंदाजे निव्वळ नफा ₹${Number(net).toLocaleString('en-IN')} आहे. हा हिशोब दिलेल्या भाव आणि खर्चाच्या गृहितकांवर आधारित आहे.`;
    }
    if (lang === 'gu') {
      return `સિસ્ટમ દ્વારા પૂરી પાડવામાં આવેલ ગણતરી મુજબ, અંદાજિત કુલ આવક ₹${Number(gross).toLocaleString('en-IN')} છે, કુલ ખર્ચ ₹${Number(expenses).toLocaleString('en-IN')} છે, અને અંદાજિત ચોખ્ખો નફો ₹${Number(net).toLocaleString('en-IN')} છે. આ ગણતરી આપેલ ભાવ અને ખર્ચની ધારણાઓ પર આધારિત છે.`;
    }
    if (lang === 'hi') {
      return `सिस्टम द्वारा प्रदान की गई गणना के आधार पर, अनुमानित कुल कमाई ₹${Number(gross).toLocaleString('en-IN')} है, कुल खर्च ₹${Number(expenses).toLocaleString('en-IN')} है, और अनुमानित शुद्ध कमाई ₹${Number(net).toLocaleString('en-IN')} है। यह गणना दिए गए भाव और खर्च के आधार पर है।`;
    }
    return `Based on the calculation provided by the system, the estimated gross revenue is ₹${Number(gross).toLocaleString('en-IN')} and the estimated net revenue is ₹${Number(net).toLocaleString('en-IN')} after ₹${Number(expenses).toLocaleString('en-IN')} in expenses. This uses the supplied price and expense assumptions.`;
  }

  // Check if quantity or price is missing
  const hasQuantity = Boolean(context.crop?.quantityKg);
  const hasPrice = Boolean(context.marketData?.currentMarket?.pricePerKg);

  if (!hasQuantity || !hasPrice) {
    if (lang === 'mr') {
      return `अंदाजे उत्पन्नाची गणना करण्यासाठी कृपया पिकाचे प्रमाण (किलो) आणि विक्री भाव सांगा.`;
    }
    if (lang === 'gu') {
      return `અંદાજિત આવકની ગણતરી કરવા માટે કૃપા કરીને પાકનું પ્રમાણ (કિલો) અને વેચાણ ભાવ જણાવો.`;
    }
    if (lang === 'hi') {
      return `अनुमानित कुल कमाई की गणना करने के लिए कृपया मात्रा (किलो) और बिक्री मूल्य (भाव) प्रदान करें।`;
    }
    return `Please provide the quantity and selling price so I can calculate the estimated gross revenue.`;
  }

  if (lang === 'mr') {
    return `हिशोबासाठी माहिती उपलब्ध नाही. कृपया Harvest Simulator मध्ये माहिती भरा.`;
  }
  if (lang === 'gu') {
    return `ગણતરી માટે વિગતો ઉપલબ્ધ નથી. કૃપા કરીને Harvest Simulator માં માહિતી દાખલ કરો.`;
  }
  if (lang === 'hi') {
    return `गणना के लिए विवरण उपलब्ध नहीं है। कृपया Harvest Simulator में जानकारी दर्ज करें।`;
  }
  return `Calculation details are incomplete. Please provide quantity and price or use the Harvest Simulator.`;
}

/**
 * Handle transport intent
 */
function handleTransport(context, lang) {
  const matches = context.transport?.matches;

  if (matches && Array.isArray(matches) && matches.length > 0) {
    const first = matches[0];
    const destination = first.destination || 'Mandi';
    const vehicle = first.vehicleType || 'Truck';

    if (lang === 'mr') {
      return `तुमच्यासाठी ${destination} कडे जाणारे ${matches.length} सामायिक वाहतूक पर्याय उपलब्ध आहेत (${vehicle}). सामायिक वाहनामुळे वाहतूक खर्चात मोठी बचत होऊ शकते.`;
    }
    if (lang === 'gu') {
      return `તમારા માટે ${destination} તરફ જતાં ${matches.length} સહિયારા વાહન વિકલ્પો ઉપલબ્ધ છે (${vehicle}). સહિયારા વાહન દ્વારા તમે પરિવહન ખર્ચમાં બચત કરી શકો છો.`;
    }
    if (lang === 'hi') {
      return `आपके लिए ${destination} की ओर जाने वाले ${matches.length} साझा वाहन उपलब्ध हैं (${vehicle})। साझा वाहन से आप भाड़े में बड़ी बचत कर सकते हैं।`;
    }
    return `Found ${matches.length} shared transport option(s) for destination ${destination}. You can pool vehicle capacity to save on transport costs.`;
  }

  if (lang === 'mr') {
    return `निवडलेल्या गंतव्य आणि तारखेसाठी कोणतेही सामायिक वाहतूक पर्याय आढळले नाहीत. तुम्ही Transport विभागातून नवीन सामायिक वाहतूक विनंती तयार करू शकता.`;
  }
  if (lang === 'gu') {
    return `મને પસંદ કરેલ ગંતવ્ય અને તારીખ માટે કોઈ યોગ્ય વાહન વિનંતી મળી નથી. તમે Transport વિભાગમાંથી નવી સહિયારી વાહન વિનંતી બનાવી શકો છો.`;
  }
  if (lang === 'hi') {
    return `मुझे चयनित गंतव्य और तारीख के लिए कोई उपयुक्त साझा परिवहन अनुरोध नहीं मिला। आप परिवहन (Transport) अनुभाग से नया साझा वाहन अनुरोध बना सकते हैं।`;
  }
  return `I couldn't find a compatible transport request for the selected destination and date. You can create a new shared transport request from the Transport section.`;
}

/**
 * Handle weather intent
 */
function handleWeather(context, lang) {
  const weather = context.weather;

  if (weather && weather.available && (weather.condition || weather.rainAlert)) {
    const condition = weather.condition || 'Clear';
    const alert = weather.rainAlert ? ` Alert: ${weather.rainAlert}` : '';

    if (lang === 'mr') {
      return `हवामानाची स्थिती: ${condition}.${weather.temperatureC ? ` तापमान: ${weather.temperatureC}°C.` : ''}${weather.rainAlert ? ` चेतावणी: ${weather.rainAlert}.` : ''} हवामानाचा अंदाज लक्षात घेऊन काढणीचे नियोजन करा.`;
    }
    if (lang === 'gu') {
      return `હવામાન માહિતી: ${condition}.${weather.temperatureC ? ` તાપમાન: ${weather.temperatureC}°C.` : ''}${weather.rainAlert ? ` ચેતવણી: ${weather.rainAlert}.` : ''} વરસાદની સ્થિતિ અનુસાર લણણીનું આયોજન કરો.`;
    }
    if (lang === 'hi') {
      return `मौसम की स्थिति: ${condition}.${weather.temperatureC ? ` तापमान: ${weather.temperatureC}°C.` : ''}${weather.rainAlert ? ` चेतावनी: ${weather.rainAlert}.` : ''} मौसम के अनुसार कटाई की योजना बनाएं।`;
    }
    return `Weather condition: ${condition}.${weather.temperatureC ? ` Temperature: ${weather.temperatureC}°C.` : ''}${alert}`;
  }

  if (lang === 'mr') {
    return `माझ्याकडे सध्या हवामानाची माहिती उपलब्ध नाही. कृपया Weather विभागात हवामान सेवा सुरू झाल्यावर तपासा.`;
  }
  if (lang === 'gu') {
    return `મારી પાસે અત્યારે સચોટ હવામાન માહિતી ઉપલબ્ધ નથી. કૃપા કરીને Weather વિભાગમાં હવામાન સેવા ઉપલબ્ધ થાય ત્યારે તપાસો.`;
  }
  if (lang === 'hi') {
    return `मेरे पास अभी विश्वसनीय मौसम की जानकारी उपलब्ध नहीं है। जब मौसम सेवा कॉन्फ़िगर हो जाए, तब कृपया Weather अनुभाग देखें।`;
  }
  return `I don't have reliable weather data available right now. Please check the Weather section when a weather service is configured.`;
}

/**
 * Handle profile intent
 */
function handleProfile(context, lang) {
  const farmer = context.farmer || {};
  const name = farmer.name || 'Farmer';
  const location = farmer.location || 'Gujarat';

  if (lang === 'mr') {
    return `नमस्कार ${name}! तुमचे स्थान ${location} आहे. तुम्ही Profile पृष्ठावर जाऊन तुमच्या शेत आणि पिकांची माहिती अपडेट करू शकता.`;
  }
  if (lang === 'gu') {
    return `નમસ્તે ${name}, તમારું સ્વાગત છે! તમારું સ્થાન ${location} છે. તમે Profile પેજ પરથી તમારી ખેતી અને પાકની વિગતો અપડેટ કરી શકો છો.`;
  }
  if (lang === 'hi') {
    return `नमस्ते ${name}! आपका स्थान ${location} है। आप Profile पेज पर जाकर अपने खेत और फसलों का विवरण अपडेट कर सकते हैं।`;
  }
  return `Hello ${name}! Your registered location is ${location}. You can update your farm size and crop details in the Farmer Profile section.`;
}

/**
 * Handle government_scheme intent
 */
function handleGovernmentScheme(context, lang, userMessage = '') {
  const query = (userMessage || '').toLowerCase();

  // PMFBY Crop Insurance
  if (query.includes('pmfby') || query.includes('fasal bima') || query.includes('पीक विमा') || query.includes('પાક વીમો') || query.includes('फसल बीमा') || query.includes('bima') || query.includes('વીમો') || query.includes('विमा')) {
    if (lang === 'mr') {
      return `🏛️ **पंतप्रधान पीक विमा योजना (PMFBY)**:
• **संरक्षण**: अवकाळी पाऊस, दुष्काळ, पूर व कीड रोगांमुळे होणाऱ्या नुकसानीस सर्वसमावेशक विमा संरक्षण.
• **प्रीमियम दर**: खरीप पिकांसाठी 2%, रब्बी पिकांसाठी 1.5%, आणि नगदी/फळबाग पिकांसाठी 5%.
• **दावा नोंदणी**: नुकसान झाल्यानंतर 72 तासांच्या आत कृषी रक्षक पोर्टल किंवा अधिकृत ॲपवर माहिती देणे अनिवार्य.
• **अधिकृत पोर्टल**: https://pmfby.gov.in/
*टीप: अधिक माहितीसाठी नजीकच्या तालुका कृषी कार्यालयाशी किंवा आपल्या CSC केंद्राशी संपर्क साधा.*`;
    }
    if (lang === 'gu') {
      return `🏛️ **પ્રધાનમંત્રી ફસલ બીમા યોજના (PMFBY)**:
• **સુરક્ષા**: અતિવૃષ્ટિ, દુષ્કાળ, કમોસમી વરસાદ અને જીવાતથી થતા પાક નુકસાન સામે સંપૂર્ણ વીમા રક્ષણ.
• **પ્રીમિયમ દર**: ખરીફ પાક માટે ૨%, રવિ પાક માટે ૧.૫%, અને બાગાયતી/વાણિજ્યિક પાક માટે ૫%.
• **ક્લેમ નોંધણી**: પાક નુકસાન થયાના ૭૨ કલાકની અંદર પીએમએફબીવાય પોર્ટલ અથવા ટોલ-ફ્રી નંબર પર જાણ કરવી જરૂરી.
• **સત્તાવાર પોર્ટલ**: https://pmfby.gov.in/
*વધુ વિગતો માટે તમારા ગામ પંચાયત VCE અથવા કૃષિ સહાયકનો સંપર્ક કરો.*`;
    }
    if (lang === 'hi') {
      return `🏛️ **प्रधानमंत्री फसल बीमा योजना (PMFBY)**:
• **सुरक्षा**: सूखा, बाढ़, बेमौसम बारिश एवं कीट प्रकोप से प्राकृतिक फसल नुकसान पर व्यापक सुरक्षा कवच।
• **प्रीमियम दर**: खरीफ फसलों पर केवल 2%, रबी फसलों पर 1.5% और वाणिज्यिक/बागवानी फसलों पर 5%।
• **दावा प्रक्रिया**: आपदा के 72 घंटे के भीतर PMFBY पोर्टल या क्रॉप इंश्योरेंस ऐप पर सूचना देना अनिवार्य।
• **आधिकारिक पोर्टल**: https://pmfby.gov.in/
*सुझाव: अधिकृत बीमा कंपनी व राज्य कृषि विभाग के माध्यम से ही क्लेम ट्रैक करें।*`;
    }
    return `🏛️ **Pradhan Mantri Fasal Bima Yojana (PMFBY)**:
• **Coverage**: Comprehensive financial risk protection against non-preventable natural risks (drought, flood, unseasonal hail, pest attacks).
• **Farmer Premium Rates**: 2.0% for Kharif crops, 1.5% for Rabi crops, and 5.0% for commercial/horticultural produce.
• **Claim Intimation**: Report localized crop damage within 72 hours via the official Crop Insurance App or portal.
• **Official Portal**: https://pmfby.gov.in/
*Notice: HarvestMitra AI connects you directly to official government portals and never asks for financial credentials.*`;
  }

  // Drip Irrigation / Micro-irrigation
  if (query.includes('drip') || query.includes('irrigation') || query.includes('सिंचाई') || query.includes('સિંચાઈ') || query.includes('ठिबक') || query.includes('micro-irrigation') || query.includes('sprinkler') || query.includes('ફુવારા') || query.includes('तुषार')) {
    if (lang === 'mr') {
      return `🏛️ **ठिबक व तुषार सिंचन शासकीय योजना (Drip & Micro-Irrigation)**:
• **योजना**: प्रधानमंत्री कृषी सिंचाई योजना (PMKSY - Per Drop More Crop) व महाडीबीटी सूक्ष्म सिंचन.
• **अनुदान**: अल्प व अत्यल्प भूधारक शेतकऱ्यांना 55% ते 70% पर्यंत थेट शासकीय अनुदान.
• **पात्रता**: 7/12 व 8-A उतारा, वीज जोडणी किंवा शाश्वत पाणी स्त्रोत असणारे सर्व शेतकरी.
• **अर्ज कसा करावा**: महाराष्ट्र MahaDBT शेतकरी पोर्टल (https://mahadbt.maharashtra.gov.in/) वर ऑनलाइन अर्ज करा.`;
    }
    if (lang === 'gu') {
      return `🏛️ **ટપક સિંચાઈ અને માઇક્રો-ઇરિગેશન યોજના (Drip Irrigation Schemes)**:
• **મુખ્ય યોજનાઓ**: ગુજરાત ગ્રીન રિવોલ્યુશન કંપની (GGRC) અને પ્રધાનમંત્રી કૃષિ સિંચાઈ યોજના (PMKSY).
• **સબસિડી લાભ**: નાના અને સીમાંત ખેડૂતોને ટપક (Drip) અને સ્પ્રિંકલર પર ૭૦% સુધી સરકારી સબસિડી.
• **જરૂરી દસ્તાવેજ**: ૭/૧૨, ૮-અ ના ઉતારા, આધાર કાર્ડ, પાણી સ્ત્રોત પુરાવો અને બેંક પાસબુક.
• **સત્તાવાર પોર્ટલ**: https://ikhedut.gujarat.gov.in/ અને https://ggrc.co.in/`;
    }
    if (lang === 'hi') {
      return `🏛️ **ड्रिप सिंचाई एवं सूक्ष्म सिंचाई सरकारी योजनाएं (Top Drip Irrigation Schemes)**:
• **प्रमुख योजनाएं**: प्रधानमंत्री कृषि सिंचाई योजना (PMKSY - Per Drop More Crop) एवं राज्य सूक्ष्म सिंचाई मिशन।
• **सब्सिडी लाभ**: लघु व सीमांत किसानों को ड्रिप व स्प्रिंकलर सिस्टम लगाने पर 55% से 70% तक सरकारी अनुदान।
• **पात्रता**: खेती योग्य भूमि, सिंचाई का जल स्रोत और वैध भूमि अभिलेख (खतौनी)।
• **आवेदन**: राज्य कृषि पोर्टल (MahaDBT / i-Khedut) पर ऑनलाइन आवेदन करें।`;
    }
    return `🏛️ **Top Government Schemes for Drip Irrigation**:
• **Key Schemes**: Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop) & State Micro-Irrigation Missions (GGRC in Gujarat / MahaDBT in Maharashtra).
• **Subsidy Benefit**: 55% to 70% capital subsidy on standard drip irrigation and sprinkler systems for small and marginal farmers.
• **Water & Yield Benefits**: Saves up to 40-50% irrigation water while boosting crop yields by 25-35%.
• **Eligibility & Documents**: Landownership records (7/12, Khatauni), Aadhaar Card, functional water source proof.
• **Official Portals**: https://pmksy.gov.in/ • https://ikhedut.gujarat.gov.in/ • https://mahadbt.maharashtra.gov.in/`;
  }


  if (query.includes('pm-kisan') || query.includes('pmkisan') || query.includes('६०००') || query.includes('6000')) {
    if (lang === 'mr') {
      return `🏛️ **पीएम-किसान (PM-KISAN) सन्मान निधी**:
• **लाभ**: पात्र शेतकरी कुटुंबांना प्रतिवर्ष ₹6,000 (3 समान हप्त्यांमध्ये ₹2,000 थेट DBT द्वारे).
• **पात्रता**: लागवडीयोग्य जमिनीची मालकी असणारे शेतकरी.
• **आवश्यक कागदपत्रे**: आधार कार्ड, 7/12 व 8-A उतारा, बँक पासबुक तपशील.
• **अधिकृत पोर्टल**: https://pmkisan.gov.in/
*टीप: HarvestMitra AI कधीही तुमचा बँक पासवर्ड, OTP किंवा आधार नंबर मागत नाही. अर्ज नेहमी अधिकृत पोर्टलवरच करा.*`;
    }
    if (lang === 'gu') {
      return `🏛️ **પ્રધાનમંત્રી કિસાન સન્માન નિધિ (PM-KISAN)**:
• **લાભ**: પાત્ર ખેડૂત પરિવારોને વાર્ષિક ₹6,000 સહાય (₹2,000 ના 3 સરખા હપ્તામાં સીધા DBT ખાતામાં).
• **પાત્રતા**: ખેતીલાયક જમીનની માલિકી ધરાવતા ખેડૂતો.
• **જરૂરી દસ્તાવેજ**: આધાર કાર્ડ, ૭/૧૨ અને ૮-અ ના ઉતારા, બેંક પાસબુક વિગત.
• **સત્તાવાર પોર્ટલ**: https://pmkisan.gov.in/
*નોંધ: HarvestMitra AI ક્યારેય બેંક પાસવર્ડ, OTP કે આધાર નંબર પૂછતું નથી. સત્તાવાર પોર્ટલ પર જ અરજી કરવી.*`;
    }
    if (lang === 'hi') {
      return `🏛️ **प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)**:
• **लाभ**: पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता (3 किस्तों में ₹2,000 सीधे बैंक खाते में).
• **पात्रता**: खेती योग्य भूमि धारक किसान परिवार.
• **आवश्यक दस्तावेज**: आधार कार्ड, भूमि अभिलेख (खतौनी/जमाबंदी), बैंक खाता विवरण.
• **आधिकारिक पोर्टल**: https://pmkisan.gov.in/
*सुझाव: HarvestMitra AI कभी भी पासवर्ड, OTP या संवेदनशील क्रेडेंशियल्स नहीं मांगता। आवेदन केवल आधिकारिक पोर्टल पर ही करें।*`;
    }
    return `🏛️ **PM-KISAN Samman Nidhi**:
• **Benefit**: ₹6,000 per year in 3 equal installments of ₹2,000 directly via DBT into Aadhaar-linked bank accounts.
• **Eligibility**: Landholding farmer families with cultivable agricultural land.
• **Required Documents**: Aadhaar Card, Land ownership record (7/12, Khatauni), Bank passbook details.
• **Official Portal**: https://pmkisan.gov.in/
*Notice: HarvestMitra AI never asks for bank passwords, OTPs, or Aadhaar numbers. Always submit official applications on verified government websites.*`;
  }

  if (query.includes('ikhedut') || query.includes('ખેડૂત') || query.includes('gujarat') || query.includes('ગુજરાત')) {
    if (lang === 'gu') {
      return `🏛️ **ગુજરાત આઈ-ખેડૂત પોર્ટલ (i-Khedut Portal)**:
• **યોજનાઓ**: ટ્રેક્ટર સહાય, ટપક સિંચાઈ (Drip Irrigation 70% સબસિડી), તાર ફેન્સિંગ, ખેત ઓજારો અને બાગાયતી યોજનાઓ.
• **અરજી પ્રક્રિયા**: i-Khedut પોર્ટલ પર ગ્રામ પંચાયત VCE અથવા ઓનલાઇન અરજી કરી ૭/૧૨, ૮-અ અને આધાર કાર્ડ સાથે અરજી સબમિટ કરવી.
• **સત્તાવાર પોર્ટલ**: https://ikhedut.gujarat.gov.in/
વધુ વિગતવાર યોજનાઓ જાણવા HarvestMitra ના **Kisan Sahayata (સરકારી યોજનાઓ)** વિભાગની મુલાકાત લો!`;
    }
    if (lang === 'hi') {
      return `🏛️ **गुजरात आई-खेड़ूत पोर्टल (Gujarat i-Khedut Portal)**:
• **योजनाएं**: ट्रैक्टर सब्सिडी, सूक्ष्म सिंचाई (ड्रिप 70% तक अनुदान), तार फेंसिंग सहायता, कृषि यंत्रीकरण।
• **आवेदन**: i-Khedut पोर्टल पर ग्राम पंचायत या ऑनलाइन माध्यम से आवेदन कर सकते हैं।
• **आधिकारिक वेबसाइट**: https://ikhedut.gujarat.gov.in/
अधिक जानकारी के लिए HarvestMitra AI के **सरकारी योजनाएं (Kisan Sahayata)** मॉड्यूल को देखें।`;
    }
    return `🏛️ **Gujarat i-Khedut Portal**:
• **Available Schemes**: Tractor subsidy (up to ₹60,000), Drip Irrigation (up to 70% subsidy via GGRC), wire fencing, agricultural implements, and horticulture assistance.
• **How to Apply**: Apply online at the official portal and verify through your village panchayat (e-Gram VCE).
• **Official Portal**: https://ikhedut.gujarat.gov.in/
Explore personalized matching on our **Kisan Sahayata — Government Schemes** finder!`;
  }

  // General scheme response
  if (lang === 'mr') {
    return `🏛️ **किसान सहायता — सरकारी कृषी योजना व अनुदान**:
शेतकऱ्यांसाठी प्रमुख सत्यापित योजना:
1. **PM-KISAN**: प्रतिवर्ष ₹6,000 उत्पन्न सहाय्य (https://pmkisan.gov.in/)
2. **PMFBY**: नैसर्गिक आपत्तीत पीक विमा संरक्षण (https://pmfby.gov.in/)
3. **Kisan Credit Card (KCC)**: 4% सवलतीच्या दरात कृषी कर्ज.
4. **Soil Health Card**: मोफत माती परीक्षण व खतांचा सल्ला.

👉 तुमच्या जमिनीचा आकार आणि पिकांनुसार तंतोतंत योजना शोधण्यासाठी आमच्या मेनूमधील **'सरकारी योजना' (Kisan Sahayata)** टॅब वापरा!`;
  }

  if (lang === 'gu') {
    return `🏛️ **કિસાન સહાયતા — સરકારી કૃષિ યોજનાઓ અને સબસિડી**:
ખેડૂતો માટે મહત્વપૂર્ણ ચકાસાયેલ યોજનાઓ:
1. **પીએમ-કિસાન**: વાર્ષિક ₹6,000 સહાય (https://pmkisan.gov.in/)
2. **પીએમ પાક વીમા યોજના (PMFBY)**: પાક નુકસાન સામે સુરક્ષા (https://pmfby.gov.in/)
3. **i-Khedut પોર્ટલ**: ટ્રેક્ટર, ટપક સિંચાઈ અને ઓજારો માટે ગુજરાત સરકારની સબસિડી (https://ikhedut.gujarat.gov.in/)
4. **કિસાન ક્રેડિટ કાર્ડ (KCC)**: સસ્તા વ્યાજ દરે ખેતી ધિરાણ.

👉 તમારી જમીન અને પાક અનુસાર યોગ્ય યોજના શોધવા ડેશબોર્ડ પર **'સરકારી યોજનાઓ' (Kisan Sahayata)** મેનૂ ખોલો!`;
  }

  if (lang === 'hi') {
    return `🏛️ **किसान सहायता — सरकारी कृषि योजनाएं एवं सब्सिडी**:
किसानों के लिए प्रमुख सत्यापित योजनाएं:
1. **PM-KISAN**: ₹6,000 प्रति वर्ष आय सहायता (https://pmkisan.gov.in/)
2. **प्रधानमंत्री फसल बीमा योजना (PMFBY)**: फसल सुरक्षा एवं क्षतिपूर्ति (https://pmfby.gov.in/)
3. **i-Khedut पोर्टल**: ट्रैक्टर, ड्रिप सिंचाई और कृषि यंत्रों पर सरकारी सब्सिडी (https://ikhedut.gujarat.gov.in/)
4. **किसान क्रेडिट कार्ड (KCC)**: 4% रियायती ब्याज दर पर कृषि ऋण।

👉 अपनी जमीन व फसल के अनुसार उपयुक्त योजनाएं खोजने के लिए हमारे मेनू में **'सरकारी योजनाएं' (Kisan Sahayata)** देखें!`;
  }

  return `🏛️ **Kisan Sahayata — Government Schemes & Subsidies**:
Here are key verified central and state agriculture schemes:
1. **PM-KISAN**: ₹6,000/year direct financial support (https://pmkisan.gov.in/)
2. **PMFBY**: Comprehensive crop insurance against weather hazards (https://pmfby.gov.in/)
3. **Gujarat i-Khedut**: Subsidies for tractors, drip irrigation, and equipment (https://ikhedut.gujarat.gov.in/)
4. **Kisan Credit Card (KCC)**: Concessional crop loans at 4% effective interest rate.
5. **Soil Health Card Scheme**: Scientific soil testing and fertilizer advice.

👉 Use the **Government Schemes** finder in your dashboard navigation to check personalized eligibility, download document checklists, and access verified government portals!`;
}

/**
 * Handle help and general guidance
 */
function handleHelp(context, lang) {
  if (lang === 'mr') {
    return `मी मित्रा असिस्टंट (Mitra Assistant) आहे. मी तुम्हाला खालील गोष्टींमध्ये मदत करू शकतो:
1. Kisan Sahayata: शासकीय योजना, अनुदान व आवश्यक कागदपत्रे.
2. Market Explorer: विविध बाजारांमधील पिकांचे दर तपासा.
3. Harvest Simulator: आज विक्री करावी की नंतर, यावरील निव्वळ नफ्याची तुलना करा.
4. Shared Transport: वाहतूक खर्च कमी करण्यासाठी वाहन पूलिंग.
5. Weather: काढणीसाठी हवामानाचा सल्ला.
तुम्ही मला कोणताही प्रश्न विचारू शकता!`;
  }

  if (lang === 'gu') {
    return `હું મિત્ર આસિસ્ટન્ટ (Mitra Assistant) છું. હું તમને આ બાબતોમાં મદદ કરી શકું છું:
1. કિસાન સહાયતા: સરકારી યોજનાઓ, સબસિડી અને જરૂરી દસ્તાવેજ યાદી.
2. Market Explorer: વિવિધ મંડીઓમાં પાકના ભાવ તપાસો.
3. Harvest Simulator: આજે વેચવું કે પછીથી તે અંગે ચોખ્ખા નફાની સરખામણી.
4. Shared Transport: પરિવહન ખર્ચ ઘટાડવા વાહન પૂલિંગ.
5. Weather: લણણી માટે હવામાન સલાહ.
તમે મને સીધો પ્રશ્ન પૂછી શકો છો!`;
  }

  if (lang === 'hi') {
    return `मैं मित्रा असिस्टेंट (Mitra Assistant) हूं। मैं आपकी इन कार्यों में सहायता कर सकता हूं:
1. किसान सहायता: सरकारी कृषि योजनाएं, सब्सिडी एवं आवश्यक दस्तावेज।
2. Market Explorer: विभिन्न मंडियों में फसलों के भाव देखें।
3. Harvest Simulator: आज बेचने या रुकने के शुद्ध लाभ की तुलना।
4. Shared Transport: भाड़ा कम करने के लिए साझा वाहन।
5. Weather: कटाई से संबंधित मौसम की जानकारी।
आप मुझसे कोई भी सवाल पूछ सकते हैं!`;
  }

  return `I am Mitra Assistant. Here is how I can assist you:
1. Kisan Sahayata: Discover government schemes, subsidies, and required document checklists.
2. Market Explorer: Check current crop prices across APMC Mandis.
3. Harvest Simulator: Compare net revenue between selling today vs holding or alternative markets.
4. Shared Transport: Find pooling options to reduce vehicle freight expenses.
5. Weather Advisories: View weather forecasts before scheduling your harvest.
Feel free to ask a specific question!`;
}

module.exports = {
  generateResponse
};
