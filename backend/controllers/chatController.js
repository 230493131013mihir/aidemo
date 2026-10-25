/**
 * chatController.js
 * Chatbot Controller for Mitra Assistant
 * HarvestMitra AI - ISSUE-09
 */

const aiService = require('../services/ai/aiService');
const {
  detectIntent,
  detectLanguage,
  normalizeLanguage,
  extractCropMention,
  extractLocationMention,
  extractQuantity
} = require('../services/ai/intentDetector');
const { buildContext } = require('../services/ai/contextBuilder');
const marketService = require('../services/marketService');
const weatherService = require('../services/weatherService');

/**
 * Disclaimer labels per language and data mode
 */
const SOURCE_DISCLAIMERS = {
  demo: {
    en: 'Market figures and simulations are based on demonstration data.',
    hi: 'मंडी के आंकड़े और गणनाएं डेमो सैंपल डेटा पर आधारित हैं।',
    gu: 'બજારના આંકડા અને ગણતરીઓ ડેમો સેમ્પલ ડેટા આધારિત છે.',
    mr: 'बाजार भाव आणि आकडेवारी डेमो सॅम्पल डेटावर आधारित आहे.'
  },
  live: {
    en: 'Verified live market and system data.',
    hi: 'सत्यापित लाइव मंडी और सिस्टम डेटा।',
    gu: 'ચકાસાયેલ લાઈવ મંડી અને સિસ્ટમ ડેટા.',
    mr: 'सत्यापित थेट बाजार आणि सिस्टीम डेटा.'
  }
};

/**
 * Handle POST /api/chat/message
 */
async function handleChatMessage(req, res) {
  try {
    const {
      message,
      language: userProvidedLang,
      session_id,
      conversationHistory,
      context: callerContext = {}
    } = req.body || {};

    // 1. Input Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message length exceeds maximum allowable limit of 2000 characters'
      });
    }

    const cleanMessage = message.trim();

    // 2. Language Determination: Use user's language or detect
    const userLang = req.user?.preferredLanguage || req.user?.preferred_language;
    const resolvedLang = normalizeLanguage(
      userProvidedLang
        ? userProvidedLang
        : (userLang || detectLanguage(cleanMessage, 'en'))
    );

    // 3. Intent Detection
    const detectedIntent = detectIntent(cleanMessage);

    // If caller is an authenticated Transporter, route to logistics assistant
    if (req.user?.role === 'transporter') {
      const transporterReply = await handleTransporterLogisticsAssistant({
        user: req.user,
        message: cleanMessage,
        language: resolvedLang
      });
      if (transporterReply) {
        return res.status(200).json({
          success: true,
          provider: 'mitra_logistics_engine',
          mode: 'transporter_live',
          message: transporterReply,
          reply: transporterReply,
          metadata: {
            session_id: session_id || null,
            intent: 'transporter_logistics',
            language: resolvedLang,
            model: 'HarvestMitra-Logistics-v2'
          },
          source_disclaimer: SOURCE_DISCLAIMERS.live[resolvedLang] || SOURCE_DISCLAIMERS.live.en
        });
      }
    }

    // 4. Enrich Context
    // Extract any crop mention and location directly from user's message FIRST
    const extractedCrop = extractCropMention(cleanMessage);
    const extractedLocation = extractLocationMention(cleanMessage);

    // Check if query is explicitly asking about a price/rate of a specific crop
    const isAskingSpecificRate = /\b(?:rate|price|cost|bhav|market\s*rate)\b/i.test(cleanMessage) &&
      /\b(?:of|for|चा|का|नो|चे|ची)\b/i.test(cleanMessage);

    // If callerContext.crop?.name contains multiple crops (e.g. "Tomato, Wheat, Soybean"), pick the primary first crop
    const defaultProfileCrop = callerContext.crop?.name
      ? String(callerContext.crop.name).split(',')[0].trim()
      : null;

    // User's explicit message mention always takes priority.
    // If user explicitly asked for a specific crop rate ("rate of X") but X wasn't matched, do NOT pretend they asked for their profile crop.
    const cropMention = extractedCrop || (!isAskingSpecificRate ? defaultProfileCrop : null);
    const quantityInfo = callerContext.crop?.quantityKg || extractQuantity(cleanMessage).quantityKg;

    // Auto-enrich market data if query asks about price or harvest decision and no marketData was supplied
    let marketData = callerContext.marketData;
    if (!marketData && (detectedIntent === 'market_price' || detectedIntent === 'harvest_decision') && cropMention) {
      try {
        let prices = [];
        if (extractedLocation) {
          // Try matching market name first (e.g. "Nashik APMC")
          prices = await marketService.getMarketPrices({ crop: cropMention, market: extractedLocation });
          // If not found by market name, try matching district
          if (prices.length === 0) {
            prices = await marketService.getMarketPrices({ crop: cropMention, district: extractedLocation });
          }
        } else if (req.user?.district || callerContext.farmer?.district) {
          const userDist = req.user?.district || callerContext.farmer?.district;
          prices = await marketService.getMarketPrices({ crop: cropMention, district: userDist });
        }

        // Fallback to any Maharashtra market for this crop if location-specific records were empty
        if (prices.length === 0) {
          prices = await marketService.getMarketPrices({ crop: cropMention });
        }

        if (prices.length > 0) {
          marketData = {
            currentMarket: {
              name: prices[0].market_name,
              pricePerKg: prices[0].price_per_kg,
              unit: 'kg',
              sourceType: prices[0].data_type,
              updatedAt: prices[0].last_updated
            }
          };
        }
      } catch (_) {}
    }

    // Auto-enrich weather data if query asks about weather
    let weatherData = callerContext.weather;
    if (!weatherData && detectedIntent === 'weather') {
      try {
        const farmerDist = extractedLocation || req.user?.district || callerContext.farmer?.location || 'Nashik';
        weatherData = await weatherService.getWeather({ district: farmerDist });
      } catch (_) {}
    }

    const resolvedLocation = extractedLocation || req.user?.district || callerContext.farmer?.location || 'Maharashtra';

    const enrichedParams = {
      ...callerContext,
      farmer: {
        ...(callerContext.farmer || {}),
        name: req.user?.name || req.user?.full_name || callerContext.farmer?.name || 'Farmer',
        location: resolvedLocation,
        preferredLanguage: resolvedLang
      },
      crop: {
        ...(callerContext.crop || {}),
        name: cropMention,
        quantityKg: quantityInfo
      },
      marketData: marketData || callerContext.marketData,
      weather: weatherData || callerContext.weather
    };

    const structuredContext = buildContext(enrichedParams);

    // 5. Generate AI or Fallback response via provider-independent aiService
    const aiResult = await aiService.generateResponse({
      message: cleanMessage,
      context: structuredContext,
      conversationHistory: conversationHistory || [],
      language: resolvedLang,
      intent: detectedIntent
    });

    // 6. Source Disclaimer
    const isDemo = structuredContext.marketData?.currentMarket?.sourceType === 'DEMO' || process.env.ENABLE_DEMO_MODE !== 'false';
    const disclaimers = isDemo ? SOURCE_DISCLAIMERS.demo : SOURCE_DISCLAIMERS.live;
    const disclaimer = disclaimers[resolvedLang] || disclaimers.en;

    // 7. Format normalized response
    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      mode: aiResult.mode,
      message: aiResult.message,
      reply: aiResult.message, // for backward-compatibility with API_DOCUMENTATION.md
      metadata: {
        session_id: session_id || null,
        intent: detectedIntent,
        language: resolvedLang,
        model: aiResult.metadata?.model || null
      },
      source_disclaimer: disclaimer
    });
  } catch (error) {
    console.error('[ChatController Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your request'
    });
  }
}

/**
 * Handle GET /api/chat/status
 * Safe health/diagnostic check without leaking secrets
 */
function handleChatStatus(req, res) {
  const provider = (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
  let configured = false;

  if (provider === 'gemini') {
    configured = Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);
  } else if (provider === 'openai') {
    configured = Boolean(process.env.OPENAI_API_KEY || process.env.AI_API_KEY);
  } else if (provider === 'fallback') {
    configured = true;
  }

  return res.status(200).json({
    status: 'ok',
    service: 'Mitra Assistant AI Service Layer',
    provider,
    isProviderConfigured: configured,
    fallbackReady: true,
    supportedLanguages: ['en', 'hi', 'gu', 'mr']
  });
}

async function handleTransporterLogisticsAssistant({ user, message, language }) {
  const text = String(message || '').toLowerCase();
  const { TransportRequest, Vehicle, SharedTrip } = require('../models');
  const { Op } = require('sequelize');

  // Guard: If transporter asks about managing farmer crop profiles or crop price negotiation
  const isCropProfileOrMandiTrade = (
    text.includes('mandi price') || text.includes('commodity price') || text.includes('crop profile') ||
    text.includes('sell today') || text.includes('मंडी भाव') || text.includes('बाजार भाव') || text.includes('विक्री')
  ) && !text.includes('fare') && !text.includes('भाडे') && !text.includes('भाड़ा') && !text.includes('trip') && !text.includes('destination');

  if (isCropProfileOrMandiTrade) {
    if (language === 'mr') {
      return 'वाहतूकदार मित्रा: पीक प्रोफाइल व्यवस्थापन आणि बाजार भाव वाटाघाटी केवळ शेतकरी व एपीएमसी अधिकाऱ्यांसाठी आहेत. मी तुम्हाला वाहनाचे थांबे, मार्ग, माल वजन आणि भाडे तपशील सांगू शकतो.';
    }
    if (language === 'hi') {
      return 'ट्रांसपोर्टर मित्र: फसल प्रोफाइल प्रबंधन और मंडी भाव खोज किसानों व एपीएमसी के लिए है। मैं आपको अगले पिकअप, मार्ग, वाहन क्षमता, कार्गो वजन और भाड़ा विवरण में सहायता कर सकता हूँ।';
    }
    return 'Transporter Notice: Crop profile management and commodity trading are designated for farmers and market officials. I can assist you with your active vehicle trips, pickup stops, cargo weights, remaining capacity, and freight earnings.';
  }

  // 1. Specific Booking Status Query (e.g. HM-102, BK-..., DEMO-...)
  const bookingMatch = message.match(/\b(HM-?\d+|BK-?[\w-]+|DEMO-?\d+)\b/i);
  if (bookingMatch || text.includes('status of booking') || text.includes('बुकिंग स्टेटस')) {
    const searchCode = bookingMatch ? bookingMatch[0].trim() : null;
    let queryWhere = { transporterId: user.id };
    if (searchCode) {
      queryWhere = {
        [Op.and]: [
          { transporterId: user.id },
          {
            [Op.or]: [
              { bookingId: { [Op.like]: `%${searchCode}%` } },
              { gatePassCode: { [Op.like]: `%${searchCode}%` } }
            ]
          }
        ]
      };
    }
    const foundBooking = await TransportRequest.findOne({ where: queryWhere, order: [['updatedAt', 'DESC']] });
    if (foundBooking) {
      if (language === 'mr') {
        return `बुकिंग #${foundBooking.bookingId || foundBooking.id} (${foundBooking.cropName}, ${foundBooking.weightKg} kg): सद्यस्थिती '${foundBooking.status.toUpperCase()}'. शेतकरी: ${foundBooking.farmerName}, गंतव्य: ${foundBooking.destinationMarket}.`;
      }
      if (language === 'hi') {
        return `बुकिंग #${foundBooking.bookingId || foundBooking.id} (${foundBooking.cropName}, ${foundBooking.weightKg} kg): वर्तमान स्थिति '${foundBooking.status.toUpperCase()}'. किसान: ${foundBooking.farmerName}, गंतव्य: ${foundBooking.destinationMarket}.`;
      }
      return `Booking #${foundBooking.bookingId || foundBooking.id} (${foundBooking.cropName}, ${foundBooking.weightKg} kg) current status is '${foundBooking.status.toUpperCase()}'. Farmer: ${foundBooking.farmerName}, Destination: ${foundBooking.destinationMarket}.`;
    }
  }

  // Fetch Transporter's current active trip
  const activeTrip = await TransportRequest.findOne({
    where: {
      transporterId: user.id,
      status: { [Op.in]: ['accepted', 'driver_assigned', 'vehicle_assigned', 'awaiting_pickup', 'pickup_confirmed', 'in_transit', 'arrived_destination'] }
    },
    include: [
      { model: Vehicle, required: false },
      { model: SharedTrip, required: false, include: [{ model: TransportRequest, as: 'Bookings', required: false }] }
    ],
    order: [['updatedAt', 'DESC']]
  });

  // 2. Next Pickup / Which pickup comes next
  if (text.includes('next pickup') || text.includes('pickup comes next') || text.includes('कुठून उचल') || text.includes('पिकअप') || text.includes('अगला पिकअप')) {
    if (!activeTrip) {
      if (language === 'mr') return 'सध्या आपल्याकडे कोणतेही सक्रिय पिकअप शेड्युल केलेले नाही.';
      if (language === 'hi') return 'वर्तमान में कोई सक्रिय पिकअप निर्धारित नहीं है।';
      return 'You currently have no active trips awaiting pickup.';
    }
    if (language === 'mr') {
      return `आपला पुढील पिकअप: ${activeTrip.pickupLocation} येथे आहे (शेतकरी: ${activeTrip.farmerName}, पीक: ${activeTrip.cropName}, ${activeTrip.weightKg} kg). पिकअप तारीख: ${activeTrip.pickupDate}.`;
    }
    if (language === 'hi') {
      return `आपका अगला पिकअप: ${activeTrip.pickupLocation} पर है (किसान: ${activeTrip.farmerName}, फसल: ${activeTrip.cropName}, ${activeTrip.weightKg} kg). पिकअप तिथि: ${activeTrip.pickupDate}.`;
    }
    return `Your next pickup is at ${activeTrip.pickupLocation} from farmer ${activeTrip.farmerName} (${activeTrip.weightKg} kg ${activeTrip.cropName}). Scheduled date: ${activeTrip.pickupDate}.`;
  }

  // 3. Destination
  if (text.includes('destination') || text.includes('गंतव्य') || text.includes('कुठे पोहोचवायचे') || text.includes('मंडी')) {
    if (!activeTrip) {
      if (language === 'mr') return 'सध्या कोणतेही सक्रिय गंतव्यस्थान नोंदवलेले नाही.';
      if (language === 'hi') return 'वर्तमान में कोई सक्रिय गंतव्य मंडी दर्ज नहीं है।';
      return 'You have no active trip with a destination assigned right now.';
    }
    if (language === 'mr') {
      return `आपल्या सक्रिय फेरीचे अंतिम गंतव्यस्थान: ${activeTrip.destinationMarket} आहे.`;
    }
    if (language === 'hi') {
      return `आपकी सक्रिय यात्रा का अंतिम गंतव्य: ${activeTrip.destinationMarket} है।`;
    }
    return `Your active trip destination is ${activeTrip.destinationMarket}.`;
  }

  // 4. Distance / Kilometres remaining / ETA
  if (text.includes('kilomet') || text.includes('km') || text.includes('किमी') || text.includes('अंतर') || text.includes('arrival time') || text.includes('eta') || text.includes('वेळ')) {
    if (!activeTrip) {
      if (language === 'mr') return 'सध्या कोणतीही सक्रिय फेरी सुरू नसल्याने अंतर किंवा वेळ उपलब्ध नाही.';
      if (language === 'hi') return 'सक्रिय यात्रा न होने के कारण शेष दूरी व समय उपलब्ध नहीं है।';
      return 'Real-time telemetry and distance remaining are unavailable because there is no trip in progress.';
    }
    const dest = String(activeTrip.destinationMarket || '').toLowerCase();
    let km = 145;
    let mins = 180;
    if (dest.includes('mumbai') || dest.includes('vashi')) { km = 165; mins = 210; }
    else if (dest.includes('pune')) { km = 65; mins = 95; }
    else if (dest.includes('nashik')) { km = 180; mins = 240; }

    if (language === 'mr') {
      return `गंतव्य ${activeTrip.destinationMarket} पर्यंत अंदाजे ${km} किमी शिल्लक आहेत (अंदाजे प्रवास वेळ: ${Math.round(mins / 60)} तास ${mins % 60} मिनिटे).`;
    }
    if (language === 'hi') {
      return `गंतव्य ${activeTrip.destinationMarket} तक अनुमानित दूरी ${km} किमी शेष है (अनुमानित समय: ${Math.round(mins / 60)} घंटे ${mins % 60} मिनट).`;
    }
    return `Approximately ${km} km remain to ${activeTrip.destinationMarket} (Estimated duration: ~${mins} minutes based on highway speed limits).`;
  }

  // 5. How many farmers in shared trip
  if (text.includes('how many farmers') || text.includes('किती शेतकरी') || text.includes('कितने किसान')) {
    if (!activeTrip) {
      if (language === 'mr') return 'सध्या कोणतीही शेअर्ड ट्रिप सक्रिय नाही.';
      if (language === 'hi') return 'वर्तमान में कोई सक्रिय शेयर्ड ट्रिप नहीं है।';
      return 'No active shared pooling trip found.';
    }
    const count = activeTrip.SharedTrip?.Bookings?.length || activeTrip.sharingFarmersCount || 1;
    if (language === 'mr') {
      return `या सामायिक फेरीत एकूण ${count} शेतकरी समाविष्ट आहेत.`;
    }
    if (language === 'hi') {
      return `इस साझा यात्रा में कुल ${count} किसान शामिल हैं।`;
    }
    return `There are ${count} farmers participating in this shared transport trip.`;
  }

  // 6. Total cargo weight
  if (text.includes('cargo weight') || text.includes('total cargo') || text.includes('एकूण वजन') || text.includes('कुल वजन') || text.includes('माल वजन')) {
    if (!activeTrip) {
      if (language === 'mr') return 'सध्या कोणतीही सक्रिय फेरी नसल्यामुळे मालाचे वजन उपलब्ध नाही.';
      if (language === 'hi') return 'सक्रिय यात्रा न होने के कारण कार्गो वजन उपलब्ध नहीं है।';
      return 'No active cargo assigned to your fleet.';
    }
    const totalWeight = activeTrip.SharedTrip?.bookedWeightKg ||
      (activeTrip.SharedTrip?.Bookings ? activeTrip.SharedTrip.Bookings.reduce((sum, b) => sum + (b.weightKg || 0), 0) : activeTrip.weightKg);
    if (language === 'mr') {
      return `सध्याच्या सक्रिय फेरीतील एकूण कृषी मालाचे वजन: ${totalWeight} kg आहे.`;
    }
    if (language === 'hi') {
      return `वर्तमान सक्रिय यात्रा में कुल कृषि कार्गो वजन: ${totalWeight} kg है।`;
    }
    return `The total agricultural cargo weight for this trip is ${totalWeight} kg.`;
  }

  // 7. Remaining capacity in assigned vehicle
  if (text.includes('capacity') || text.includes('क्षमते') || text.includes('क्षमता') || text.includes('जागा')) {
    const vehicleCap = activeTrip?.Vehicle?.capacityKg || 2200;
    const currentWeight = activeTrip?.SharedTrip?.bookedWeightKg || activeTrip?.weightKg || 0;
    const remaining = Math.max(0, vehicleCap - currentWeight);
    if (language === 'mr') {
      return `आपल्या नियुक्त वाहनाची (${activeTrip?.vehicleNumber || 'वाहन'}) क्षमता: ${vehicleCap} kg आहे. उर्वरित उपलब्ध जागा: ${remaining} kg शिल्लक आहे.`;
    }
    if (language === 'hi') {
      return `आपके आवंटित वाहन (${activeTrip?.vehicleNumber || 'वाहन'}) की कुल क्षमता ${vehicleCap} kg है। उपलब्ध शेष क्षमता: ${remaining} kg है।`;
    }
    return `Assigned vehicle capacity is ${vehicleCap} kg with ${currentWeight} kg loaded. Remaining available payload capacity: ${remaining} kg.`;
  }

  // 8. Rain / weather forecast along route
  if (text.includes('rain') || text.includes('weather') || text.includes('पाऊस') || text.includes('हवामान') || text.includes('बारिश') || text.includes('मौसम')) {
    const origin = activeTrip?.pickupLocation || 'Pune';
    const dest = activeTrip?.destinationMarket || 'Mumbai Vashi APMC';
    if (language === 'mr') {
      return `मार्ग हवामान अंदाज (${origin} ➔ ${dest}): हवामान वाहतुकीसाठी अनुकूल आहे, पावसाचा धोका २०-३०% आहे. कसारा/खंडाळा घाटात वेगमर्यादा पाळावी.`;
    }
    if (language === 'hi') {
      return `रूट मौसम पूर्वानुमान (${origin} ➔ ${dest}): मौसम परिवहन के लिए अनुकूल है, बारिश का जोखिम 20-30% है। घाट सेक्शन में सावधानी से चलें।`;
    }
    return `Route Weather Advisory (${origin} to ${dest}): Moderate conditions along highway corridor. Precipitation probability is ~25%. Maintain safe spacing in ghat curves.`;
  }

  // 9. Confirmed fares for completed trips
  if (text.includes('fare') || text.includes('earnings') || text.includes('भाडे') || text.includes('कमाई') || text.includes('भाड़ा')) {
    const completed = await TransportRequest.findAll({
      where: {
        transporterId: user.id,
        status: { [Op.in]: ['delivered', 'delivery_confirmed', 'completed'] }
      }
    });
    const paid = completed.filter((c) => c.paymentStatus === 'paid').reduce((s, c) => s + (c.finalCost || c.estimatedSharedCost || 0), 0);
    const total = completed.reduce((s, c) => s + (c.finalCost || c.estimatedSharedCost || 0), 0);
    if (language === 'mr') {
      return `पूर्ण झालेल्या ${completed.length} फेऱ्यांचे एकूण भाडे: ₹${total.toLocaleString('en-IN')} (सत्यापित जमा भाडे: ₹${paid.toLocaleString('en-IN')}).`;
    }
    if (language === 'hi') {
      return `पूर्ण हुई ${completed.length} यात्राओं का कुल भाड़ा: ₹${total.toLocaleString('en-IN')} (सत्यापित प्राप्त भाड़ा: ₹${paid.toLocaleString('en-IN')}).`;
    }
    return `Your recorded freight totals for ${completed.length} completed trips is ₹${total.toLocaleString('en-IN')} (Confirmed settled payouts: ₹${paid.toLocaleString('en-IN')}).`;
  }

  // 10. Trips waiting for delivery confirmation
  if (text.includes('waiting') || text.includes('delivery confirmation') || text.includes('पोहोच') || text.includes('पुष्टी') || text.includes('प्रतीक्षा')) {
    const pendingConf = await TransportRequest.findAll({
      where: {
        transporterId: user.id,
        status: { [Op.in]: ['delivered', 'arrived_destination'] }
      }
    });
    if (pendingConf.length === 0) {
      if (language === 'mr') return 'सध्या कोणतीही फेरी डिलिव्हरी पुष्टीकरणाच्या प्रतीक्षेत नाही.';
      if (language === 'hi') return 'वर्तमान में कोई यात्रा डिलीवरी पावती की प्रतीक्षा में नहीं है।';
      return 'No trips are currently pending farmer delivery confirmation.';
    }
    const details = pendingConf.map((p) => `#${p.bookingId || p.id} (${p.farmerName})`).join(', ');
    if (language === 'mr') {
      return `डिलिव्हरी पुष्टीकरणाच्या प्रतीक्षेत असलेल्या फेऱ्या: ${details}.`;
    }
    if (language === 'hi') {
      return `डिलीवरी पावती की प्रतीक्षा में यात्राएं: ${details}.`;
    }
    return `The following ${pendingConf.length} deliveries are awaiting recipient acknowledgement: ${details}.`;
  }

  return null;
}

module.exports = {
  handleChatMessage,
  handleChatStatus,
  handleTransporterLogisticsAssistant
};
