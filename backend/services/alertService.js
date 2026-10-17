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
}

module.exports = new AlertService();
