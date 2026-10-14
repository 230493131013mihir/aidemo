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
 * Handle help and general guidance
 */
function handleHelp(context, lang) {
  if (lang === 'mr') {
    return `मी मित्रा असिस्टंट (Mitra Assistant) आहे. मी तुम्हाला खालील गोष्टींमध्ये मदत करू शकतो:
1. Market Explorer: विविध बाजारांमधील पिकांचे दर तपासा.
2. Harvest Simulator: आज विक्री करावी की नंतर, यावरील निव्वळ नफ्याची तुलना करा.
3. Shared Transport: वाहतूक खर्च कमी करण्यासाठी वाहन पूलिंग.
4. Weather: काढणीसाठी हवामानाचा सल्ला.
तुम्ही मला कोणताही प्रश्न विचारू शकता!`;
  }

  if (lang === 'gu') {
    return `હું મિત્ર આસિસ્ટન્ટ (Mitra Assistant) છું. હું તમને આ બાબતોમાં મદદ કરી શકું છું:
1. Market Explorer: વિવિધ મંડીઓમાં પાકના ભાવ તપાસો.
2. Harvest Simulator: આજે વેચવું કે પછીથી તે અંગે ચોખ્ખા નફાની સરખામણી.
3. Shared Transport: પરિવહન ખર્ચ ઘટાડવા વાહન પૂલિંગ.
4. Weather: લણણી માટે હવામાન સલાહ.
તમે મને સીધો પ્રશ્ન પૂછી શકો છો!`;
  }

  if (lang === 'hi') {
    return `मैं मित्रा असिस्टेंट (Mitra Assistant) हूं। मैं आपकी इन कार्यों में सहायता कर सकता हूं:
1. Market Explorer: विभिन्न मंडियों में फसलों के भाव देखें।
2. Harvest Simulator: आज बेचने या रुकने के शुद्ध लाभ की तुलना।
3. Shared Transport: भाड़ा कम करने के लिए साझा वाहन।
4. Weather: कटाई से संबंधित मौसम की जानकारी।
आप मुझसे कोई भी सवाल पूछ सकते हैं!`;
  }

  return `I am Mitra Assistant. Here is how I can assist you:
1. Market Explorer: Check current crop prices across APMC Mandis.
2. Harvest Simulator: Compare net revenue between selling today vs holding or alternative markets.
3. Shared Transport: Find pooling options to reduce vehicle freight expenses.
4. Weather Advisories: View weather forecasts before scheduling your harvest.
Feel free to ask a specific question!`;
}

module.exports = {
  generateResponse
};
