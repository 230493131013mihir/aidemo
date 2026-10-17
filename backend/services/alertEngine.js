/**
 * alertEngine.js
 * Smart Price Surge & Drop Alert Engine with Multilingual Payloads
 * HarvestMitra AI - ISSUE-77
 */

function generatePriceAlerts(params = {}) {
  const {
    cropName = 'Tomato',
    currentPrice = 32.0,
    targetHigh = 30.0,
    targetLow = 20.0,
    mandiName = 'Pune APMC',
    lang = 'mr'
  } = params;

  const isSurge = currentPrice >= targetHigh;
  const isDrop = currentPrice <= targetLow;

  const templates = {
    mr: {
      surge: `🚀 कृषी भाव वाढ सूचना: ${mandiName} मध्ये ${cropName} चा भाव वाढून ₹${currentPrice}/kg झाला आहे! आपला लक्ष्यांक ₹${targetHigh} ओलांडला आहे. माल विक्रीसाठी उत्तम वेळ आहे.`,
      drop: `⚠️ कृषी भाव घसरण सूचना: ${mandiName} मध्ये ${cropName} चा भाव घसरून ₹${currentPrice}/kg झाला आहे. नुकसान टाळण्यासाठी माल साठवणूक करा किंवा पर्यायी मंडी पहा.`
    },
    gu: {
      surge: `🚀 ભાવ વધારાની ચેતવણી: ${mandiName} માં ${cropName} નો ભાવ વધીને ₹${currentPrice}/kg થયો છે! તમારો લક્ષ્યાંક ₹${targetHigh} વટાવી ગયો છે. માલ વેચવા માટે ઉત્તમ સમય છે.`,
      drop: `⚠️ ભાવ ઘટવાની ચેતવણી: ${mandiName} માં ${cropName} નો ભાવ ઘટીને ₹${currentPrice}/kg થયો છે. નુકસાન ટાળવા માટે માલ સંગ્રહ કરો અથવા અન્ય મંડી ચકાસો.`
    },
    hi: {
      surge: `🚀 मूल्य वृद्धि चेतावनी: ${mandiName} में ${cropName} का भाव बढ़कर ₹${currentPrice}/kg हो गया है! आपका लक्ष्य ₹${targetHigh} पार कर चुका है। बिक्री का सही समय है।`,
      drop: `⚠️ मूल्य गिरावट चेतावनी: ${mandiName} में ${cropName} का भाव घटकर ₹${currentPrice}/kg हो गया है। भंडारण करें या दूसरी मंडी देखें।`
    },
    en: {
      surge: `🚀 Price Surge Alert: ${cropName} price at ${mandiName} reached ₹${currentPrice}/kg, exceeding your threshold of ₹${targetHigh}/kg! Recommended window to sell.`,
      drop: `⚠️ Price Drop Alert: ${cropName} price at ${mandiName} fell to ₹${currentPrice}/kg, below your safety line of ₹${targetLow}/kg. Consider holding produce.`
    }
  };

  const selectedTemplate = templates[lang] || templates.en;
  let alertMessage = null;
  let severity = 'NORMAL';

  if (isSurge) {
    alertMessage = selectedTemplate.surge;
    severity = 'HIGH_POSITIVE';
  } else if (isDrop) {
    alertMessage = selectedTemplate.drop;
    severity = 'HIGH_NEGATIVE';
  }

  return {
    triggered: Boolean(alertMessage),
    severity,
    crop: cropName,
    mandi: mandiName,
    currentPrice,
    alertMessage,
    notificationPayload: {
      smsText: alertMessage,
      whatsappFormat: alertMessage ? `*HarvestMitra Alert*\n${alertMessage}` : null
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = { generatePriceAlerts };
