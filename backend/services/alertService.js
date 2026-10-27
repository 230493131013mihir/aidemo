/**
 * alertService.js
 * Price Surge / Drop Alert Simulator with Multilingual WhatsApp & SMS Payloads
 * HarvestMitra AI - ISSUE #77
 *
 * Supports:
 * - Marathi (mr)
 * - Hindi (hi)
 * - Gujarati (gu)
 * - English (en)
 */

const marketService = require('./marketService');
const weatherService = require('./weatherService');

const LOCALIZED_DICTIONARY = {
  mr: {
    surgeTitle: '🌾 कृषी भाव वाढ सूचना (Price Surge Alert)',
    dropTitle: '⚠️ कृषी भाव घसरण सूचना (Price Drop Alert)',
    stableTitle: 'ℹ️ बाजार भाव स्थिरता सूचना (Price Stable)',
    mandiLabel: 'बाजार समिती',
    cropLabel: 'पीक',
    currentPriceLabel: 'सध्याचा भाव',
    previousPriceLabel: 'मागील भाव',
    changeLabel: 'बदल',
    surgeAdvice: 'उत्कृष्ट संधी! उच्च दराचा फायदा घेण्यासाठी आपला शेतमाल त्वरित या बाजारात विक्रीसाठी आणा.',
    dropAdvice: 'सावधगिरी! बाजारात घसरण सुरू आहे. शक्य असल्यास माल काही दिवस गोदामात साठवा किंवा पर्यायी बाजाराचा विचार करा.',
    stableAdvice: 'बाजार संतुलित आहे. पूर्वनियोजित काढणी वेळापत्रकानुसार विक्री सुरू ठेवा.',
    actionSell: 'त्वरित विक्री करा',
    actionHold: 'काही दिवस थांबा / साठवणूक करा',
    actionMonitor: 'बाजारावर लक्ष ठेवा',
    ctaText: 'थेट बाजार दर आणि वाहतूक पूलिंग पहा:',
    smsSurge: (crop, market, price, pct) =>
      `हार्वेस्टमित्र: ${market} मध्ये ${crop} चा भाव +${pct}% वाढून रु.${price}/किलो झाला. उत्तम नफ्यासाठी त्वरित विक्री करा! link: harvestmitra.in/mandis`,
    smsDrop: (crop, market, price, pct) =>
      `हार्वेस्टमित्र: सावधान! ${market} मध्ये ${crop} चा भाव ${pct}% घसरून रु.${price}/किलो झाला. घाईने विक्री टाळा किंवा साठवणूक करा. link: harvestmitra.in/mandis`,
    smsStable: (crop, market, price) =>
      `हार्वेस्टमित्र: ${market} मध्ये ${crop} चा भाव स्थिर रु.${price}/किलो आहे. link: harvestmitra.in/mandis`
  },
  hi: {
    surgeTitle: '🌾 मंडी भाव तेजी अलर्ट (Price Surge Alert)',
    dropTitle: '⚠️ मंडी भाव गिरावट अलर्ट (Price Drop Alert)',
    stableTitle: 'ℹ️ मंडी भाव स्थिरता अलर्ट (Price Stable)',
    mandiLabel: 'मंडी',
    cropLabel: 'फसल',
    currentPriceLabel: 'वर्तमान भाव',
    previousPriceLabel: 'पिछला भाव',
    changeLabel: 'बदलाव',
    surgeAdvice: 'शानदार अवसर! ऊंचे दाम का लाभ उठाने के लिए अपनी फसल तुरंत इस मंडी में विक्रय हेतु लाएं।',
    dropAdvice: 'सावधानी! कीमतों में मंदी का रुख है। यदि संभव हो तो माल रोकें या कोल्ड स्टोरेज/वैकल्पिक मंडी का रुख करें।',
    stableAdvice: 'मंडी सामान्य दायरे में कारोबार कर रही है। नियमित योजना के अनुसार बिक्री जारी रखें।',
    actionSell: 'तुरंत विक्रय करें',
    actionHold: 'रोकें / भंडारण करें',
    actionMonitor: 'मंडी पर नजर रखें',
    ctaText: 'लाइव मंडी भाव व शेयर्ड ट्रांसपोर्ट देखें:',
    smsSurge: (crop, market, price, pct) =>
      `हार्वेस्टमित्र: ${market} में ${crop} का भाव +${pct}% बढ़कर रु.${price}/किग्रा हुआ। अच्छे मुनाफे हेतु तुरंत विक्रय करें! link: harvestmitra.in/mandis`,
    smsDrop: (crop, market, price, pct) =>
      `हार्वेस्टमित्र: सावधान! ${market} में ${crop} का भाव ${pct}% गिरकर रु.${price}/किग्रा हुआ। जल्दबाजी में न बेचें। link: harvestmitra.in/mandis`,
    smsStable: (crop, market, price) =>
      `हार्वेस्टमित्र: ${market} में ${crop} का भाव स्थिर रु.${price}/किग्रा है। link: harvestmitra.in/mandis`
  },
  gu: {
    surgeTitle: '🌾 માર્કેટિંગ યાર્ડ ભાવ વધારો એલર્ટ (Price Surge Alert)',
    dropTitle: '⚠️ માર્કેટિંગ યાર્ડ ભાવ ઘટાડો એલર્ટ (Price Drop Alert)',
    stableTitle: 'ℹ️ માર્કેટિંગ યાર્ડ સ્થિર ભાવ (Price Stable)',
    mandiLabel: 'માર્કેટિંગ યાર્ડ',
    cropLabel: 'પાક',
    currentPriceLabel: 'હાલનો ભાવ',
    previousPriceLabel: 'અગાઉનો ભાવ',
    changeLabel: 'ફેરફાર',
    surgeAdvice: 'શ્રેષ્ઠ તક! ઊંચા ભાવનો લાભ લેવા માટે તમારો પાક તાત્કાલિક આ યાર્ડમાં વેચાણ માટે લાવો.',
    dropAdvice: 'સાવચેત રહો! ભાવમાં ઘટાડો થયો છે. જો શક્ય હોય તો પાક થોડા દિવસ સાચવો અથવા વૈકલ્પિક માર્કેટ તપાસો.',
    stableAdvice: 'બજાર સ્થિર છે. નિયમિત આયોજન મુજબ વેચાણ ચાલુ રાખો.',
    actionSell: 'તાત્કાલિક વેચો',
    actionHold: 'થોડા દિવસ હોલ્ડ કરો / સંગ્રહ કરો',
    actionMonitor: 'ભાવ પર નજર રાખો',
    ctaText: 'લાઈવ માર્કેટ ભાવ અને શેર્ડ ટ્રાન્સપોર્ટ જુઓ:',
    smsSurge: (crop, market, price, pct) =>
      `હાર્વેસ્ટમિત્ર: ${market} માં ${crop} નો ભાવ +${pct}% વધીને રૂ.${price}/કિલો થયો. સારા નફા માટે તાત્કાલિક વેચો! link: harvestmitra.in/mandis`,
    smsDrop: (crop, market, price, pct) =>
      `હાર્વેસ્ટમિત્ર: સાવધાન! ${market} માં ${crop} નો ભાવ ${pct}% ઘટીને રૂ.${price}/કિલો થયો. ઉતાવળે વેચાણ ટાળો. link: harvestmitra.in/mandis`,
    smsStable: (crop, market, price) =>
      `હાર્વેસ્ટમિત્ર: ${market} માં ${crop} નો ભાવ રૂ.${price}/કિલો પર સ્થિર છે. link: harvestmitra.in/mandis`
  },
  en: {
    surgeTitle: '🌾 APMC Mandi Price Surge Alert',
    dropTitle: '⚠️ APMC Mandi Price Drop Alert',
    stableTitle: 'ℹ️ APMC Mandi Price Stability Notice',
    mandiLabel: 'Mandi Market',
    cropLabel: 'Commodity',
    currentPriceLabel: 'Current Price',
    previousPriceLabel: 'Baseline Price',
    changeLabel: 'Change',
    surgeAdvice: 'Prime selling opportunity! Capture peak APMC auction prices by arranging harvest transport to this market.',
    dropAdvice: 'Downside market risk! Consider holding produce in safe storage or routing to an alternate metro mandi.',
    stableAdvice: 'Prices are trading in a narrow equilibrium. Proceed with normal harvest and logistics schedule.',
    actionSell: 'Sell Immediately',
    actionHold: 'Hold & Store Produce',
    actionMonitor: 'Monitor Trends',
    ctaText: 'Explore verified APMC rates & shared transport pool:',
    smsSurge: (crop, market, price, pct) =>
      `HarvestMitra Alert: ${crop} surged +${pct}% to Rs.${price}/kg at ${market}. Sell now to capture peak profit! link: harvestmitra.in/mandis`,
    smsDrop: (crop, market, price, pct) =>
      `HarvestMitra Alert: Caution! ${crop} dropped ${pct}% to Rs.${price}/kg at ${market}. Avoid distress selling. link: harvestmitra.in/mandis`,
    smsStable: (crop, market, price) =>
      `HarvestMitra: ${crop} trading steady at Rs.${price}/kg in ${market}. link: harvestmitra.in/mandis`
  }
};

class AlertService {
  /**
   * ISSUE #77: Simulate or Detect Price Surge / Drop Alert
   */
  async simulatePriceAlert(params = {}) {
    const crop = params.crop || params.commodity || 'Cotton';
    const market = params.market || params.mandi || 'Nashik APMC';
    const district = params.district || 'Nashik';
    const state = params.state || 'Maharashtra';
    const farmerName = params.farmerName || 'Ramesh Patel';
    const farmerPhone = params.farmerPhone || '+91 98765 43210';
    const language = (params.language || 'mr').toLowerCase();
    const thresholdPercent = Number(params.thresholdPercent || 5.0);

    const langDict = LOCALIZED_DICTIONARY[language] || LOCALIZED_DICTIONARY.en;

    // Determine current and baseline prices
    let currentPrice = params.currentPrice ? Number(params.currentPrice) : null;
    let baselinePrice = params.baselinePrice ? Number(params.baselinePrice) : null;

    if (!currentPrice || !baselinePrice) {
      const prices = await marketService.getMarketPrices({ crop, market, limit: 1 });
      const activePrice = prices.length > 0 ? prices[0].price_per_kg : 28.0;

      if (!currentPrice) {
        // If forceSurge / forceDrop flag is provided in simulation
        if (params.simulationType === 'surge' || params.forceSurge) {
          currentPrice = Number((activePrice * (1 + (thresholdPercent + 3) / 100)).toFixed(2));
          baselinePrice = activePrice;
        } else if (params.simulationType === 'drop' || params.forceDrop) {
          currentPrice = Number((activePrice * (1 - (thresholdPercent + 4) / 100)).toFixed(2));
          baselinePrice = activePrice;
        } else {
          currentPrice = activePrice;
          baselinePrice = Number((activePrice * 0.94).toFixed(2));
        }
      } else if (!baselinePrice) {
        baselinePrice = Number((currentPrice * 0.93).toFixed(2));
      }
    }

    const priceDiff = Number((currentPrice - baselinePrice).toFixed(2));
    const percentChange = Number(((priceDiff / baselinePrice) * 100).toFixed(2));

    let alertType = 'PRICE_STABLE';
    let severity = 'LOW';
    let actionRecommendation = langDict.actionMonitor;
    let advisoryNote = langDict.stableAdvice;
    let title = langDict.stableTitle;

    if (percentChange >= thresholdPercent) {
      alertType = 'PRICE_SURGE';
      severity = percentChange >= 12 ? 'HIGH' : 'MEDIUM';
      actionRecommendation = langDict.actionSell;
      advisoryNote = langDict.surgeAdvice;
      title = langDict.surgeTitle;
    } else if (percentChange <= -thresholdPercent) {
      alertType = 'PRICE_DROP';
      severity = percentChange <= -12 ? 'HIGH' : 'MEDIUM';
      actionRecommendation = langDict.actionHold;
      advisoryNote = langDict.dropAdvice;
      title = langDict.dropTitle;
    }

    // Build WhatsApp formatted payload
    const emojiHeader = alertType === 'PRICE_SURGE' ? '🚀📈' : (alertType === 'PRICE_DROP' ? '⚠️📉' : '⚖️');
    const whatsappPayload = [
      `${emojiHeader} *${title}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👨‍🌾 *शेतकरी:* ${farmerName}`,
      `📍 *${langDict.mandiLabel}:* ${market} (${district})`,
      `🌾 *${langDict.cropLabel}:* ${crop}`,
      ``,
      `💰 *${langDict.currentPriceLabel}:* ₹${currentPrice}/kg (₹${Math.round(currentPrice * 100)}/क्विंटल)`,
      `⏱️ *${langDict.previousPriceLabel}:* ₹${baselinePrice}/kg`,
      `📊 *${langDict.changeLabel}:* ${percentChange >= 0 ? '+' : ''}${percentChange}% (₹${priceDiff > 0 ? '+' : ''}${priceDiff}/kg)`,
      ``,
      `💡 *सल्ला:* ${advisoryNote}`,
      `🎯 *कृती:* *${actionRecommendation}*`,
      ``,
      `🔗 ${langDict.ctaText}`,
      `https://harvestmitra.in/mandis?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(market)}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `_हार्वेस्टमित्र एआय — स्मार्ट शेती, सुरक्षित नफा_`
    ].join('\n');

    // Build SMS payload (<160 chars)
    let smsPayload = '';
    if (alertType === 'PRICE_SURGE') {
      smsPayload = langDict.smsSurge(crop, market, currentPrice, percentChange);
    } else if (alertType === 'PRICE_DROP') {
      smsPayload = langDict.smsDrop(crop, market, currentPrice, percentChange);
    } else {
      smsPayload = langDict.smsStable(crop, market, currentPrice);
    }

    // Ensure SMS is clean & trimmed
    smsPayload = smsPayload.slice(0, 160);

    const alertId = `HM-ALT-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      alertId,
      alertType,
      severity,
      crop,
      market,
      district,
      state,
      currentPrice,
      baselinePrice,
      priceDiff,
      percentChange,
      thresholdPercent,
      farmer: {
        name: farmerName,
        phone: farmerPhone,
        language
      },
      actionRecommendation,
      advisoryNote,
      notifications: {
        whatsapp: {
          channel: 'WhatsApp Cloud API',
          recipient: farmerPhone,
          message: whatsappPayload,
          previewUrl: `https://harvestmitra.in/mandis?crop=${encodeURIComponent(crop)}`
        },
        sms: {
          channel: 'GSM SMS Gateway',
          recipient: farmerPhone,
          message: smsPayload,
          charCount: smsPayload.length,
          isWithinGsmLimit: smsPayload.length <= 160
        }
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * ISSUE #77: Dispatch Alert Notification (Simulator / Gateway)
   */
  async dispatchAlert(alertData, channels = ['whatsapp', 'sms']) {
    const timestamp = new Date().toISOString();
    const notificationId = `HM-DISP-${Math.floor(100000 + Math.random() * 900000)}`;

    const response = {
      success: true,
      notificationId,
      dispatchedAt: timestamp,
      recipient: {
        name: alertData.farmer?.name || 'Farmer',
        phone: alertData.farmer?.phone || '+91 98765 43210'
      },
      channels: {}
    };

    if (channels.includes('whatsapp') && alertData.notifications?.whatsapp) {
      response.channels.whatsapp = {
        status: 'DELIVERED',
        gateway: 'META_WHATSAPP_BUSINESS_API',
        messageId: `wamid.HBgMOTE${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        deliveredAt: timestamp,
        payloadSizeChars: alertData.notifications.whatsapp.message.length
      };
    }

    if (channels.includes('sms') && alertData.notifications?.sms) {
      response.channels.sms = {
        status: 'DELIVERED',
        gateway: 'BHARAT_NATIONAL_SMS_PORTAL',
        messageId: `SMS-${Math.floor(10000000 + Math.random() * 90000000)}`,
        deliveredAt: timestamp,
        charCount: alertData.notifications.sms.charCount
      };
    }

    return response;
  }

  /**
   * ISSUE #77: Scan & Retrieve Active APMC Price Alerts Across Maharashtra Mandis
   */
  async getActiveMarketAlerts(filter = {}) {
    const thresholdPercent = Number(filter.thresholdPercent || 4.5);
    const targetState = filter.state || 'Maharashtra';

    const testCrops = ['Cotton', 'Tomato', 'Soybean', 'Onion', 'Wheat'];
    const activeAlerts = [];

    for (const crop of testCrops) {
      const prices = await marketService.getMarketPrices({ crop, state: targetState });
      if (prices.length >= 2) {
        // Compare highest market against median
        const sorted = [...prices].sort((a, b) => b.price_per_kg - a.price_per_kg);
        const top = sorted[0];
        const median = sorted[Math.floor(sorted.length / 2)];

        const diff = Number((top.price_per_kg - median.price_per_kg).toFixed(2));
        const pct = Number(((diff / median.price_per_kg) * 100).toFixed(2));

        if (pct >= thresholdPercent) {
          activeAlerts.push({
            id: `ALT-${crop.toLowerCase()}-${top.market_id}`,
            alertType: 'PRICE_SURGE',
            crop,
            market: top.market_name,
            district: top.district,
            state: targetState,
            currentPrice: top.price_per_kg,
            baselinePrice: median.price_per_kg,
            percentChange: pct,
            priceDiff: diff,
            severity: pct >= 10 ? 'HIGH' : 'MEDIUM',
            recommendation: `Sell ${crop} at ${top.market_name} to capture a ₹${diff}/kg (+${pct}%) premium over average state rates.`
          });
        }
      }
    }

    return {
      success: true,
      count: activeAlerts.length,
      thresholdPercent,
      state: targetState,
      alerts: activeAlerts
    };
  }

  /**
   * ISSUE Task: WhatsApp Alert Dispatch Simulator for Mandi Gate Pass & Weather Advisory
   * Connects Weather Rain Advisory (>60% rain warning) and Mandi Gate Pass
   */
  async generateGatePassWhatsAppAlert(params = {}) {
    const passId = params.gatePassCode || params.passId || params.passCode || params.id || `MH-APMC-${Math.floor(100000 + Math.random() * 900000)}`;
    const farmerName = params.farmerName || 'Ramesh Patel';
    const farmerPhone = params.farmerPhone || params.phone || '+91 98765 43210';
    const cropName = params.cropName || params.crop || 'Tomato';
    const weightKg = Number(params.weightKg || params.quantity || 1200);
    const pickupLocation = params.pickupLocation || 'Haveli, Pune';
    const destinationMarket = params.destinationMarket || params.destination || 'Mumbai Vashi Mega APMC';
    const pickupDate = params.pickupDate || new Date().toISOString().split('T')[0];
    const driverName = params.driverName || 'Driver Assignment Pending';
    const driverPhone = params.driverPhone || '';
    const vehicleNumber = params.vehicleNumber || 'Vehicle Assignment Pending';
    const vehicleType = params.vehicleType || 'Commercial Freight Carrier';
    const arrivalTimestamp = params.arrivalTimestamp || (params.estimatedDurationMinutes ? `~${params.estimatedDurationMinutes} mins` : '07:30 AM Entry Slot');
    const language = (params.language || 'mr').toLowerCase();
    const qrLink = params.qrLink || `https://harvestmitra.in/gatepass?code=${encodeURIComponent(passId)}`;

    // Determine district for weather advisory check
    let district = params.district;
    if (!district && pickupLocation) {
      const parts = pickupLocation.split(',');
      district = parts[parts.length - 1].trim();
    }
    district = district || 'Pune';

    // Determine Rain Probability & Advisory
    let rainProbability = params.rainProbability !== undefined ? Number(params.rainProbability) : null;
    let weatherAdvisory = params.weatherAdvisory || null;

    if (rainProbability === null) {
      try {
        const weather = await weatherService.getWeather({ district });
        if (weather && weather.weather) {
          rainProbability = weather.weather.rainProbability || weather.rainChance || 0;
          weatherAdvisory = weather.advisory || weatherService.generateRainAdvisory(rainProbability);
        }
      } catch (_) {
        rainProbability = 45; // safe default fallback
      }
    }

    if (rainProbability === null) rainProbability = 45;
    if (!weatherAdvisory) {
      weatherAdvisory = weatherService.generateRainAdvisory(rainProbability);
    }

    const isHeavyRainWarning = rainProbability >= 60;

    // Multilingual Localization Dictionaries for Gate Pass
    const dicts = {
      mr: {
        title: '🌾 *डिजिटल एपीएमसी मंडी गेट पास व शेतमाल वाहतूक पत्र*',
        divider: '━━━━━━━━━━━━━━━━━━━━',
        passId: `🆔 *गेट पास क्र.:* ${passId}`,
        farmer: `👨‍🌾 *शेतकरी:* ${farmerName} (${farmerPhone})`,
        cargo: `🥬 *शेतमाल / वजन:* ${weightKg} kg ${cropName}`,
        pickup: `📍 *उचल ठिकाण (Pickup):* ${pickupLocation}`,
        dest: `🏛️ *गंतव्य एपीएमसी (Destination):* ${destinationMarket}`,
        driver: `🚚 *चालक व वाहन:* ${driverName} (${vehicleNumber} • ${vehicleType})`,
        date: `📅 *तारीख व वेळ:* ${pickupDate} (${arrivalTimestamp})`,
        status: `✅ *स्थिती:* प्रमाणित ई-गेट क्लिअरन्स (Verified e-Gate Pass)`,
        qrTitle: `📱 *डिजिटल क्यूआर पडताळणी लिंक (Digital Pass):*`,
        qrTip: `हे डिजिटल क्यूआर टोकन एपीएमसी वजन काटा आणि प्रवेशद्वारावर स्कॅन करा:`,
        weatherWarningTitle: `🌧️ *हवामान पाऊस सतर्कता इशारा (>60% Rain Warning):*`,
        weatherWarningMsg: `सावधान! ${district} परिसरात पावसाची शक्यता ${rainProbability}% आहे. माल खराब होऊ नये म्हणून कृपया वाहनावर वॉटरप्रूफ ताडपत्री वापरा किंवा शेडमध्ये सुरक्षित ठेवा.`,
        footer: `_महाराष्ट्र राज्य कृषी पणन मंडळ व हार्वेस्टमित्र एआय द्वारे प्रमाणित_`
      },
      hi: {
        title: '🌾 *डिजिटल एपीएमसी मंडी गेट पास एवं परिवहन पत्र*',
        divider: '━━━━━━━━━━━━━━━━━━━━',
        passId: `🆔 *गेट पास संख्या:* ${passId}`,
        farmer: `👨‍🌾 *किसान:* ${farmerName} (${farmerPhone})`,
        cargo: `🥬 *फसल / वजन:* ${weightKg} kg ${cropName}`,
        pickup: `📍 *पिकअप स्थान:* ${pickupLocation}`,
        dest: `🏛️ *गंतव्य मंडी:* ${destinationMarket}`,
        driver: `🚚 *चालक व वाहन:* ${driverName} (${vehicleNumber} • ${vehicleType})`,
        date: `📅 *दिनांक व समय:* ${pickupDate} (${arrivalTimestamp})`,
        status: `✅ *स्थिति:* सत्यापित ई-गेट क्लीयरेंस (Verified e-Gate Pass)`,
        qrTitle: `📱 *डिजिटल क्यूआर सत्यापन लिंक (Digital Pass):*`,
        qrTip: `यह डिजिटल क्यूआर टोकन मंडी धर्मकांटा एवं प्रवेश द्वार पर दिखाएं:`,
        weatherWarningTitle: `🌧️ *मौसम भारी बारिश चेतावनी अलर्ट (>60% Rain Warning):*`,
        weatherWarningMsg: `सावधानी! ${district} में वर्षा की संभावना ${rainProbability}% है। फसल को भीगने से बचाने हेतु वाटरप्रूफ तिरपाल से ढकें अथवा सुरक्षित स्थान पर रखें।`,
        footer: `_कृषि उपज मंडी समिति एवं हार्वेस्टमित्र एआई द्वारा सत्यापित_`
      },
      gu: {
        title: '🌾 *ડિજિટલ એપીએમસી માર્કેટિંગ યાર્ડ ગેટ પાસ*',
        divider: '━━━━━━━━━━━━━━━━━━━━',
        passId: `🆔 *ગેટ પાસ નં.:* ${passId}`,
        farmer: `👨‍🌾 *ખેડૂત:* ${farmerName} (${farmerPhone})`,
        cargo: `🥬 *પાક / વજન:* ${weightKg} kg ${cropName}`,
        pickup: `📍 *ઉપાડ સ્થળ:* ${pickupLocation}`,
        dest: `🏛️ *ગંતવ્ય યાર્ડ:* ${destinationMarket}`,
        driver: `🚚 *ડ્રાઇવર અને વાહન:* ${driverName} (${vehicleNumber} • ${vehicleType})`,
        date: `📅 *તારીખ:* ${pickupDate} (${arrivalTimestamp})`,
        status: `✅ *સ્થિતિ:* ચકાસાયેલ ઈ-ગેટ ક્લિયરન્સ (Verified e-Gate Pass)`,
        qrTitle: `📱 *ડિજિટલ ક્યુઆર ચકાસણી લિંક:*`,
        qrTip: `આ ડિજિટલ ક્યુઆર ટોકન માર્કેટિંગ યાર્ડના તોલમાપ કાંટા પર રજૂ કરો:`,
        weatherWarningTitle: `🌧️ *હવામાન ભારે વરસાદ ચેતવણી (>60% Rain Warning):*`,
        weatherWarningMsg: `સાવધાન! ${district} માં વરસાદની શક્યતા ${rainProbability}% છે. પાકને સુરક્ષિત રાખવા તાડપત્રી ઢાંકો.`,
        footer: `_ગુજરાત રાજ્ય કૃષિ બજાર બોર્ડ અને હાર્વેસ્ટમિત્ર એઆઈ દ્વારા પ્રમાણિત_`
      },
      en: {
        title: '🌾 *Digital APMC Mandi Gate Pass & Transit Clearance*',
        divider: '━━━━━━━━━━━━━━━━━━━━',
        passId: `🆔 *Pass ID:* ${passId}`,
        farmer: `👤 *Farmer:* ${farmerName} (${farmerPhone})`,
        cargo: `🥬 *Cargo:* ${weightKg} kg of ${cropName}`,
        pickup: `📍 *Pickup:* ${pickupLocation}`,
        dest: `🏛️ *Destination APMC:* ${destinationMarket}`,
        driver: `🚚 *Driver & Vehicle:* ${driverName} (${vehicleNumber} • ${vehicleType})`,
        date: `📅 *Scheduled Date:* ${pickupDate} (${arrivalTimestamp})`,
        status: `✅ *Status:* Verified e-Gate Clearance`,
        qrTitle: `📱 *Digital QR Verification Link:*`,
        qrTip: `Present this verified digital QR token at the APMC weighing station:`,
        weatherWarningTitle: `🌧️ *Weather Rain Advisory (>60% Rain Warning):*`,
        weatherWarningMsg: `Alert! Heavy rain probability is ${rainProbability}% in ${district}. Ensure vehicle freight beds are covered with waterproof tarpaulins to prevent damage.`,
        footer: `_Issued by HarvestMitra Agritech & APMC Logistics Authority_`
      }
    };

    const d = dicts[language] || dicts.mr;

    // Build WhatsApp message text
    const messageLines = [
      d.title,
      d.divider,
      d.passId,
      d.farmer,
      d.cargo,
      d.pickup,
      d.dest,
      d.driver,
      d.date,
      d.status,
      ``,
      d.qrTitle,
      `${d.qrTip}`,
      `${qrLink}`,
      ``
    ];

    // Connect Weather Rain Advisory (>60% rain warning)
    if (isHeavyRainWarning) {
      messageLines.push(
        d.weatherWarningTitle,
        d.weatherWarningMsg,
        ``
      );
    }

    messageLines.push(
      d.divider,
      d.footer
    );

    const whatsappPayload = messageLines.join('\n');

    // Build short SMS payload (<160 chars)
    const smsPayload = `HarvestMitra Gate Pass: ${passId} for ${weightKg}kg ${cropName} to ${destinationMarket}. Vehicle: ${vehicleNumber}. Driver: ${driverName}. QR: ${qrLink}`.slice(0, 160);

    const alertId = `HM-WAPASS-${Math.floor(100000 + Math.random() * 900000)}`;
    const messageId = `wamid.HBgMOTE${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    return {
      success: true,
      alertId,
      status: 'DELIVERED',
      channel: 'WhatsApp Cloud API',
      gateway: 'META_WHATSAPP_BUSINESS_API',
      messageId,
      deliveredAt: new Date().toISOString(),
      recipient: {
        name: farmerName,
        phone: farmerPhone,
        language
      },
      gatePass: {
        passId,
        gatePassCode: passId,
        crop: cropName,
        cropName,
        weightKg,
        pickupLocation,
        destinationMarket,
        pickupDate,
        driverName,
        driverPhone,
        vehicleNumber,
        vehicleType,
        arrivalTimestamp,
        qrLink
      },
      weatherAdvisory: {
        district,
        rainProbability,
        isRainWarning: isHeavyRainWarning,
        advisoryActive: isHeavyRainWarning,
        threshold: 60,
        level: isHeavyRainWarning ? 'RAIN_ADVISORY' : 'CLEAR_ADVISORY',
        tips: weatherAdvisory?.actionableTips || []
      },
      isRainAdvisoryAttached: isHeavyRainWarning,
      rainProbability,
      message: whatsappPayload,
      smsMessage: smsPayload,
      qrLink,
      previewUrl: qrLink
    };
  }

  /**
   * Dispatch Gate Pass WhatsApp Notification (Simulator)
   */
  async sendGatePassWhatsAppAlert(params = {}) {
    return await this.generateGatePassWhatsAppAlert(params);
  }

  /**
   * Generate & Dispatch Standalone Weather Rain Advisory WhatsApp Alert
   */
  async sendWeatherWhatsAppAlert(params = {}) {
    const district = params.district || 'Surat';
    const state = params.state || 'Gujarat';
    const farmerName = params.farmerName || 'Farmer';
    const farmerPhone = params.farmerPhone || params.phone || '+91 98765 43210';
    const language = (params.language || 'mr').toLowerCase();
    
    let rainProbability = params.rainProbability !== undefined ? Number(params.rainProbability) : null;
    let advisory = params.advisory || null;

    if (rainProbability === null) {
      const weather = await weatherService.getWeather({ district, state });
      rainProbability = weather?.weather?.rainProbability ?? 65;
      advisory = weather?.advisory || weatherService.generateRainAdvisory(rainProbability);
    }

    const isRainWarning = rainProbability >= 60;
    const alertId = `HM-WAWX-${Math.floor(100000 + Math.random() * 900000)}`;
    const messageId = `wamid.HBgMOTE${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const text = [
      `🌧️ *हार्वेस्टमित्र हवामान पाऊस अलर्ट (Weather Advisory)*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👨‍🌾 *शेतकरी:* ${farmerName}`,
      `📍 *जिल्हा:* ${district} (${state})`,
      `☔ *पावसाची शक्यता:* ${rainProbability}% (सतर्कता मर्यादा: 60%)`,
      `📊 *स्थिती:* ${isRainWarning ? '⚠️ मुसळधार पाऊस इशारा (RAIN_ADVISORY)' : '✅ अनुकूल हवामान (CLEAR)'}`,
      ``,
      `💡 *कृषी सल्ला:* ${isRainWarning ? 'काढणी केलेला शेतमाल सुरक्षित शेडमध्ये ठेवा किंवा ताडपत्रीने झाका. वाहतूक वाहनांची कव्हरिंग तपासा.' : 'काढणी व वाहतूक सुरळीत सुरू ठेवता येईल.'}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🔗 हवामान व मंडी वाहतूक पहा: https://harvestmitra.in/weather?district=${encodeURIComponent(district)}`
    ].join('\n');

    return {
      success: true,
      alertId,
      status: 'DELIVERED',
      channel: 'WhatsApp Cloud API',
      gateway: 'META_WHATSAPP_BUSINESS_API',
      messageId,
      recipient: {
        name: farmerName,
        phone: farmerPhone
      },
      district,
      state,
      rainProbability,
      isRainWarning,
      advisory,
      message: text,
      previewUrl: `https://harvestmitra.in/weather?district=${encodeURIComponent(district)}`,
      dispatchedAt: new Date().toISOString()
    };
  }
}

module.exports = new AlertService();

