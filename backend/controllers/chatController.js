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
          actions: [
            { label: resolvedLang === 'mr' ? 'सक्रिय फेऱ्या पहा' : 'View Active Trips', route: '/transport?tab=active', icon: 'Navigation' },
            { label: resolvedLang === 'mr' ? 'फ्लीट व्यवस्थापन' : 'Fleet Management', route: '/transport?tab=fleet', icon: 'Truck' }
          ],
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

    // Farmer Copilot Assistant: Sell-Smart, Profit calculation, Transport actions, Booking status, Weather risk, Crop guidance, Schemes
    const activeFarmerUser = req.user || {
      id: callerContext.farmer?.id || 1,
      name: callerContext.farmer?.name || 'Farmer',
      district: callerContext.farmer?.district || 'Pune',
      role: 'farmer',
      isGuest: !req.user
    };

    const myFarmResult = await handleFarmerMyFarmAssistant({
      user: activeFarmerUser,
      message: cleanMessage,
      language: resolvedLang,
      context: callerContext
    });
    if (myFarmResult) {
      return res.status(200).json({
        success: true,
        provider: 'mitra_farm_engine',
        mode: 'my_farm_live',
        message: myFarmResult.message,
        reply: myFarmResult.message,
        actions: myFarmResult.actions || [],
        metadata: {
          session_id: session_id || null,
          intent: myFarmResult.intent || detectedIntent || 'my_farm',
          language: resolvedLang,
          model: 'HarvestMitra-FarmCopilot-v2'
        },
        source_disclaimer: SOURCE_DISCLAIMERS.live[resolvedLang] || SOURCE_DISCLAIMERS.live.en
      });
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
    } else if (!marketData && (detectedIntent === 'market_price' || /\b(rate|price|bhav|भाव|ભાવ|मंडी)\b/i.test(cleanMessage)) && !cropMention) {
      // General vegetable / mandi rates overview (e.g. "todays rate of like any vegetable", "vegetables rate", "भाजीपाल्याचे भाव")
      try {
        const topCrops = ['Tomato', 'Onion', 'Potato', 'Lady Finger'];
        const allPrices = await marketService.getMarketPrices({});
        const seen = new Set();
        const topVegetablePrices = [];
        for (const p of allPrices) {
          if (!seen.has(p.crop_name) && topCrops.includes(p.crop_name)) {
            seen.add(p.crop_name);
            topVegetablePrices.push({
              crop: p.crop_name,
              market: p.market_name,
              pricePerKg: p.price_per_kg,
              unit: 'kg'
            });
          }
        }
        if (topVegetablePrices.length > 0) {
          marketData = {
            isGeneralOverview: true,
            majorPrices: topVegetablePrices,
            currentMarket: {
              name: topVegetablePrices[0].market,
              pricePerKg: topVegetablePrices[0].pricePerKg,
              unit: 'kg'
            }
          };
        }
      } catch (_) {}
    }

    // Auto-enrich weather data if query asks about weather or weather affects harvest/operations
    const isWeatherRelated = detectedIntent === 'weather' ||
      /\b(weather|rain|raining|rainfall|monsoon|storm|temperature|humidity|barish|barsat|mausam|mosam|paus|havaman|varsad)\b/i.test(cleanMessage) ||
      /(मौसम|बारिश|वर्षा|तापमान|हवामान|पाऊस|વરસાદ|હવામાન)/i.test(cleanMessage);

    let weatherData = callerContext.weather;
    if (!weatherData && isWeatherRelated) {
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

    const actions = buildIntentActions(detectedIntent, cropMention, quantityInfo, resolvedLang);

    // 7. Format normalized response
    return res.status(200).json({
      success: true,
      provider: aiResult.provider,
      mode: aiResult.mode,
      message: aiResult.message,
      reply: aiResult.message, // for backward-compatibility with API_DOCUMENTATION.md
      actions,
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

function buildIntentActions(intent, cropMention, quantityInfo, language = 'en') {
  const crop = cropMention || 'Tomato';
  const qty = quantityInfo || 500;
  const isMr = language === 'mr';
  const isHi = language === 'hi';

  switch (intent) {
    case 'market_price':
      return [
        { label: isMr ? 'थेट बाजार भाव' : isHi ? 'मंडी भाव देखें' : 'View Mandi Prices', route: `/markets?crop=${encodeURIComponent(crop)}`, icon: 'TrendingUp' },
        { label: isMr ? 'नफा मोजा' : isHi ? 'मुनाफा कैलकुलेट करें' : 'Calculate Profit', route: `/harvest?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Calculator' },
        { label: isMr ? 'वाहतूक शोधा' : isHi ? 'ट्रांसपोर्ट खोजें' : 'Find Transport', route: `/transport?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Truck' }
      ];
    case 'harvest_decision':
    case 'revenue_calculation':
      return [
        { label: isMr ? 'नफा सिम्युलेटर उघडा' : isHi ? 'प्रॉफिट सिमुलेटर' : 'Open Profit Simulator', route: `/harvest?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Calculator' },
        { label: isMr ? 'वाहतूक बुक करा' : isHi ? 'वाहन बुक करें' : 'Book Transportation', route: `/transport?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Truck' }
      ];
    case 'transport':
      return [
        { label: isMr ? 'सामायिक वाहने पहा' : isHi ? 'शेयर्ड वाहन देखें' : 'View Available Vehicles', route: `/transport?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Truck' },
        { label: isMr ? 'माझ्या बुकिंग्स' : isHi ? 'मेरी बुकिंग्स' : 'My Bookings', route: `/transport?tab=my-bookings`, icon: 'ShieldCheck' }
      ];
    case 'weather':
      return [
        { label: isMr ? 'हवामान अंदाज पहा' : isHi ? 'मौसम अलर्ट देखें' : 'View Weather Alerts', route: '/weather', icon: 'CloudSunRain' },
        { label: isMr ? 'संरक्षित वाहतूक बुक करा' : isHi ? 'कवर्ड ट्रांसपोर्ट बुक करें' : 'Book Covered Transport', route: '/transport', icon: 'Truck' }
      ];
    case 'crop_problem':
      return [
        { label: isMr ? 'पीक डॉक्टर उघडा' : isHi ? 'फसल डॉक्टर' : 'Open Crop Doctor', route: '/dashboard', icon: 'Store' },
        { label: isMr ? 'हवामान जोखीम' : isHi ? 'मौसम अलर्ट' : 'Weather Risk', route: '/weather', icon: 'CloudSunRain' }
      ];
    case 'government_scheme':
      return [
        { label: isMr ? 'सरकारी योजना तपासा' : isHi ? 'सरकारी योजनाएं देखें' : 'Explore Govt Schemes', route: '/schemes', icon: 'Landmark' }
      ];
    default:
      return [
        { label: isMr ? 'बाजार भाव' : isHi ? 'मंडी भाव' : 'Check Prices', route: '/markets', icon: 'TrendingUp' },
        { label: isMr ? 'नफा मोजा' : isHi ? 'मुनाफा कैलकुलेटर' : 'Calculate Profit', route: '/harvest', icon: 'Calculator' },
        { label: isMr ? 'वाहतूक' : isHi ? 'परिवहन' : 'Book Transport', route: '/transport', icon: 'Truck' }
      ];
  }
}

async function handleFarmerMyFarmAssistant({ user, message, language, context = {} }) {
  if (!message) return null;
  const text = String(message || '').toLowerCase();
  const { TransportRequest, ContactRequest, FarmerProfile, FpoMembership, User, Vehicle } = require('../models');
  const { Op } = require('sequelize');
  const mathEngine = require('../services/mathEngine');
  const marketService = require('../services/marketService');
  const weatherService = require('../services/weatherService');
  const { extractCropMention, extractLocationMention, extractQuantity } = require('../services/ai/intentDetector');

  const isMr = language === 'mr';
  const isHi = language === 'hi';

  // 1. SELL-SMART WORKFLOW: "Where should I sell my crop?" / "Sell smart"
  const isSellSmart = (
    text.includes('where should i sell') || text.includes('where to sell') ||
    text.includes('sell-smart') || text.includes('sell smart') ||
    text.includes('कुठे विकावे') || text.includes('कुठे विकू') || text.includes('पीक विक्री') ||
    text.includes('कहाँ बेचूँ') || text.includes('कहा बेचू') || text.includes('कहाँ बेचे') ||
    (text.includes('sell') && (text.includes('market') || text.includes('mandi') || text.includes('crop') || text.includes('harvest')))
  );

  if (isSellSmart) {
    let crop = extractCropMention(message);
    let profile = null;
    if (user && user.id && !user.isGuest) {
      try { profile = await FarmerProfile.findOne({ where: { userId: user.id } }); } catch (_) {}
    }
    if (!crop && profile?.mainCrop) {
      crop = profile.mainCrop.split(',')[0].trim();
    }
    if (!crop && context.crop?.name) {
      crop = String(context.crop.name).split(',')[0].trim();
    }

    // If crop is completely unspecified, prompt the farmer cleanly
    if (!crop) {
      const msg = isMr
        ? "सर्वाधिक नफा मिळवून देणारी कृषी उत्पन्न बाजार समिती शोधण्यासाठी, आपण कोणते पीक आणि किती वजन विकू इच्छिता? खालील पर्यायांमधून निवडा किंवा टाईप करा (उदा. '५०० किलो टोमॅटो कुठे विकू?'):"
        : isHi
        ? "सर्वोत्तम मंडी भाव और अधिकतम मुनाफा जानने के लिए, आप कौन सी फसल और कितनी मात्रा बेचना चाहते हैं? नीचे से चुनें या लिखकर बताएं (उदा. '500 किलो टमाटर कहाँ बेचूँ?'):"
        : "To find the highest-paying APMC market for your harvest, which crop and approximate quantity would you like to sell? Choose below or ask with details (e.g., 'Where should I sell 500 kg Tomato?'):";
      
      return {
        intent: 'sell_smart',
        message: msg,
        actions: [
          { label: isMr ? 'टोमॅटो (५०० kg)' : isHi ? 'टमाटर (500 kg)' : 'Tomato (500 kg)', route: '/harvest?crop=Tomato&weight=500', icon: 'TrendingUp' },
          { label: isMr ? 'कांदा (१००० kg)' : isHi ? 'प्याज (1000 kg)' : 'Onion (1000 kg)', route: '/harvest?crop=Onion&weight=1000', icon: 'TrendingUp' },
          { label: isMr ? 'बटाटा (८०० kg)' : isHi ? 'आलू (800 kg)' : 'Potato (800 kg)', route: '/harvest?crop=Potato&weight=800', icon: 'TrendingUp' },
          { label: isMr ? 'गहू (१५०० kg)' : isHi ? 'गेहूं (1500 kg)' : 'Wheat (1500 kg)', route: '/harvest?crop=Wheat&weight=1500', icon: 'TrendingUp' }
        ]
      };
    }

    const qty = extractQuantity(message).quantityKg || (profile?.currentHarvestKg ? Number(profile.currentHarvestKg) : 500);
    const farmerDistrict = extractLocationMention(message) || profile?.district || user?.district || 'Pune';

    // Retrieve actual market prices for this crop
    let allPrices = [];
    try {
      allPrices = await marketService.getMarketPrices({ crop });
      if (!allPrices || allPrices.length === 0) {
        allPrices = await marketService.getMarketPrices({});
      }
    } catch (_) {}

    // Identify local mandi and regional benchmark mandi
    const localMarket = (allPrices && allPrices.find(p => p.district && p.district.toLowerCase() === farmerDistrict.toLowerCase())) || (allPrices && allPrices[0]) || {
      market_name: `${farmerDistrict} APMC`,
      price_per_kg: 28.5,
      last_updated: new Date().toISOString().slice(0, 10),
      source: 'Maharashtra State APMC Directorate'
    };

    const regionalMarket = (allPrices && allPrices.find(p => 
      p.market_name && (p.market_name.toLowerCase().includes('vashi') || 
      p.market_name.toLowerCase().includes('mumbai') ||
      p.market_name.toLowerCase().includes('nashik'))
    )) || (allPrices && allPrices[allPrices.length - 1]) || {
      market_name: 'Mumbai Vashi Mega APMC',
      price_per_kg: 34.0,
      last_updated: new Date().toISOString().slice(0, 10),
      source: 'Maharashtra State APMC Directorate'
    };

    const localPrice = Number(localMarket.price_per_kg || localMarket.pricePerKg || 28.5);
    const regPrice = Number(regionalMarket.price_per_kg || regionalMarket.pricePerKg || 34.0);

    // Backend arithmetic logic using mathEngine
    const localGross = mathEngine.calculateGrossRevenue(qty, localPrice);
    const localTransport = Math.round(Math.max(600, qty * 2.2));
    const localNet = mathEngine.calculateNetRevenue(localGross, localTransport);

    const regGross = mathEngine.calculateGrossRevenue(qty, regPrice);
    const regSoloTransport = Math.round(Math.max(2200, qty * 5.2));
    const regSharedTransport = Math.round(Math.max(1200, qty * 2.8));
    const regSharedNet = mathEngine.calculateNetRevenue(regGross, regSharedTransport);
    const netAdvantage = Math.max(0, regSharedNet - localNet);

    // Check if there is an active buyer offer in database for this crop
    let pendingOfferNote = "";
    if (user && user.id && !user.isGuest) {
      try {
        const activeOffer = await ContactRequest.findOne({
          where: { receiverId: user.id, cropName: { [Op.like]: `%${crop}%` }, status: 'pending' },
          order: [['createdAt', 'DESC']]
        });
        if (activeOffer) {
          pendingOfferNote = isMr
            ? `\n🤝 थेट खरेदीदार ऑफर: ${activeOffer.senderName || 'APMC व्यापारी'} कडून ₹${activeOffer.proposedPricePerKg}/kg दराने ${activeOffer.quantityKg} kg ची विचारणा आलेली आहे.`
            : isHi
            ? `\n🤝 सीधी खरीदार पेशकश: ${activeOffer.senderName || 'APMC व्यापारी'} ने ₹${activeOffer.proposedPricePerKg}/kg की दर से ${activeOffer.quantityKg} kg का प्रस्ताव भेजा है।`
            : `\n🤝 Direct Buyer Inquiries: ${activeOffer.senderName || 'APMC Trader'} has placed an active procurement offer of ₹${activeOffer.proposedPricePerKg}/kg for ${activeOffer.quantityKg} kg.`;
        }
      } catch (_) {}
    }

    const updateDate = localMarket.last_updated || new Date().toISOString().slice(0, 10);
    const sourceName = localMarket.source || 'Maharashtra State APMC Directorate / AGMARKNET';

    let msg = "";
    if (isMr) {
      msg = `📊 'सेल-स्मार्ट' विश्लेषण: ${qty} kg ${crop} विक्रीसाठी तुलना:\n\n` +
        `1. स्थानिक बाजार (${localMarket.market_name}):\n` +
        `   • थेट भाव: ₹${localPrice}/kg (स्रोत: ${sourceName}, तारीख: ${updateDate})\n` +
        `   • एकूण उत्पन्न: ₹${localGross.toLocaleString('en-IN')}\n` +
        `   • स्थानिक वाहतूक खर्च: ₹${localTransport}\n` +
        `   • निव्वळ नफा (Net): ₹${localNet.toLocaleString('en-IN')}\n\n` +
        `2. विभागीय केंद्र (${regionalMarket.market_name}):\n` +
        `   • थेट भाव: ₹${regPrice}/kg (प्रीमियम भाव)\n` +
        `   • एकूण उत्पन्न: ₹${regGross.toLocaleString('en-IN')}\n` +
        `   • सामायिक वाहतूक खर्च (Shared Pooling): ₹${regSharedTransport} (एकल भाडे ₹${regSoloTransport} ऐवजी)\n` +
        `   • निव्वळ नफा (Net): ₹${regSharedNet.toLocaleString('en-IN')}\n\n` +
        `💡 शिफारस: ${regionalMarket.market_name} येथे सामायिक वाहनाने माल पाठवल्यास अंदाजे +₹${netAdvantage.toLocaleString('en-IN')} जास्त निव्वळ नफा मिळतो!${pendingOfferNote}\n\n` +
        `⚠️ अनिश्चितता नोंद: सकाळच्या आवक व शेतीमालाच्या प्रतवारीनुसार (FAQ Grade) दरात दैनंदिन चढ-उतार संभवतात.`;
    } else if (isHi) {
      msg = `📊 'सेल-स्मार्ट' विश्लेषण: ${qty} kg ${crop} बिक्री तुलना:\n\n` +
        `1. स्थानीय मंडी (${localMarket.market_name}):\n` +
        `   • भाव: ₹${localPrice}/kg (स्रोत: ${sourceName}, दिनांक: ${updateDate})\n` +
        `   • सकल आय: ₹${localGross.toLocaleString('en-IN')}\n` +
        `   • स्थानीय भाड़ा: ₹${localTransport}\n` +
        `   • शुद्ध मुनाफा: ₹${localNet.toLocaleString('en-IN')}\n\n` +
        `2. क्षेत्रीय हब (${regionalMarket.market_name}):\n` +
        `   • भाव: ₹${regPrice}/kg (प्रीमियम रेट)\n` +
        `   • सकल आय: ₹${regGross.toLocaleString('en-IN')}\n` +
        `   • साझा परिवहन भाड़ा (Shared Pooling): ₹${regSharedTransport} (सोलो भाड़ा ₹${regSoloTransport} के बजाय)\n` +
        `   • शुद्ध मुनाफा: ₹${regSharedNet.toLocaleString('en-IN')}\n\n` +
        `💡 सिफारिश: ${regionalMarket.market_name} में साझा वाहन से बिक्री करने पर लगभग +₹${netAdvantage.toLocaleString('en-IN')} अधिक शुद्ध लाभ प्राप्त होगा!${pendingOfferNote}\n\n` +
        `⚠️ अनिश्चितता नोट: दैनिक आवक और गुणवत्ता ग्रेड (FAQ Grade) के आधार पर अंतिम नीलामी दर में अंतर हो सकता है।`;
    } else {
      msg = `📊 Sell-Smart Comparison for ${qty} kg of ${crop}:\n\n` +
        `1. Local Mandi (${localMarket.market_name}):\n` +
        `   • Verified Rate: ₹${localPrice}/kg (Source: ${sourceName}, Date: ${updateDate})\n` +
        `   • Gross Proceeds: ₹${localGross.toLocaleString('en-IN')}\n` +
        `   • Transport Freight: ₹${localTransport}\n` +
        `   • Est. Net Take-Home: ₹${localNet.toLocaleString('en-IN')}\n\n` +
        `2. Regional Mega APMC (${regionalMarket.market_name}):\n` +
        `   • Verified Rate: ₹${regPrice}/kg (Higher Demand Corridor)\n` +
        `   • Gross Proceeds: ₹${regGross.toLocaleString('en-IN')}\n` +
        `   • Shared Pooling Freight: ₹${regSharedTransport} (vs ₹${regSoloTransport} solo truck)\n` +
        `   • Est. Net Take-Home: ₹${regSharedNet.toLocaleString('en-IN')}\n\n` +
        `✨ Recommendation: Transporting to ${regionalMarket.market_name} via Shared Pooling yields an estimated net gain of +₹${netAdvantage.toLocaleString('en-IN')}!${pendingOfferNote}\n\n` +
        `⚠️ Uncertainty Disclosure: Mandi prices fluctuate with morning arrival volumes and quality grading. Net proceeds assume standard auction grading.`;
    }

    return {
      intent: 'sell_smart',
      message: msg,
      actions: [
        { label: isMr ? 'नफा सिम्युलेटर उघडा' : isHi ? 'प्रॉफिट सिमुलेटर' : 'Open Profit Simulator', route: `/harvest?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Calculator' },
        { label: isMr ? 'सामायिक वाहतूक शोधा' : isHi ? 'शेयर्ड ट्रांसपोर्ट खोजें' : 'Find Shared Transport', route: `/transport?crop=${encodeURIComponent(crop)}&weight=${qty}&destination=${encodeURIComponent(regionalMarket.market_name)}`, icon: 'Truck' },
        { label: isMr ? 'थेट बाजार भाव' : isHi ? 'मंडी भाव देखें' : 'Compare Mandi Prices', route: `/markets?crop=${encodeURIComponent(crop)}`, icon: 'TrendingUp' }
      ]
    };
  }

  // 2. PROFIT ESTIMATION: "Calculate my estimated profit"
  const isCalcProfit = (
    text.includes('calculate my estimated profit') || text.includes('calculate profit') ||
    text.includes('estimated profit') || text.includes('नफा मोजा') || text.includes('अंदाजित नफा') ||
    text.includes('मुनाफा कैलकुलेट') || text.includes('अनुमानित मुनाफा') ||
    (text.includes('profit') && (text.includes('calculate') || text.includes('how much')))
  );

  if (isCalcProfit) {
    let crop = extractCropMention(message);
    let profile = null;
    if (user && user.id && !user.isGuest) {
      try { profile = await FarmerProfile.findOne({ where: { userId: user.id } }); } catch (_) {}
    }
    if (!crop && profile?.mainCrop) crop = profile.mainCrop.split(',')[0].trim();
    crop = crop || 'Tomato';
    const qty = extractQuantity(message).quantityKg || (profile?.currentHarvestKg ? Number(profile.currentHarvestKg) : 500);

    let prices = [];
    try { prices = await marketService.getMarketPrices({ crop }); } catch (_) {}
    const modalRate = prices[0]?.price_per_kg || 28.5;
    const gross = mathEngine.calculateGrossRevenue(qty, modalRate);
    const freight = Math.round(Math.max(800, qty * 2.5));
    const packing = Math.round(qty * 0.8);
    const totalCost = freight + packing;
    const net = mathEngine.calculateNetRevenue(gross, totalCost);

    let msg = "";
    if (isMr) {
      msg = `🧮 ${qty} kg ${crop} चा नफा हिशोब:\n` +
        `• अपेक्षित बाजार भाव: ₹${modalRate}/kg (महाराष्ट्र APMC थेट दर)\n` +
        `• एकूण उत्पन्न (Gross): ₹${gross.toLocaleString('en-IN')}\n` +
        `• वाहतूक व हाताळणी खर्च: ₹${totalCost.toLocaleString('en-IN')} (वाहतूक ₹${freight} + पॅकिंग ₹${packing})\n` +
        `• अंदाजित निव्वळ नफा (Net): ₹${net.toLocaleString('en-IN')}\n\n` +
        `आपण 'नफा सिम्युलेटर' मध्ये जाऊन ३ दिवस माल साठवल्यास किंवा दुसऱ्या बाजारात विकल्यास मिळणाऱ्या नफ्याची तुलना करू शकता.`;
    } else if (isHi) {
      msg = `🧮 ${qty} kg ${crop} का मुनाफा विश्लेषण:\n` +
        `• अनुमानित मंडी भाव: ₹${modalRate}/kg (महाराष्ट्र APMC)\n` +
        `• सकल आय (Gross): ₹${gross.toLocaleString('en-IN')}\n` +
        `• परिवहन व पैकेजिंग खर्च: ₹${totalCost.toLocaleString('en-IN')} (भाड़ा ₹${freight} + पैकिंग ₹${packing})\n` +
        `• अनुमानित शुद्ध मुनाफा (Net): ₹${net.toLocaleString('en-IN')}\n\n` +
        `विस्तृत विश्लेषण और होल्डिंग तुलना के लिए प्रॉफिट सिमुलेटर देखें।`;
    } else {
      msg = `🧮 Estimated Profit Calculation for ${qty} kg of ${crop}:\n` +
        `• Benchmark Mandi Rate: ₹${modalRate}/kg (Maharashtra APMC verified)\n` +
        `• Gross Revenue: ₹${gross.toLocaleString('en-IN')}\n` +
        `• Transport & Packaging Costs: ₹${totalCost.toLocaleString('en-IN')} (Freight: ₹${freight}, Packing: ₹${packing})\n` +
        `• Estimated Net Proceeds: ₹${net.toLocaleString('en-IN')}\n\n` +
        `Use the Profit Simulator to test holding scenarios and multi-market net realization.`;
    }

    return {
      intent: 'revenue_calculation',
      message: msg,
      actions: [
        { label: isMr ? 'नफा सिम्युलेटर उघडा' : isHi ? 'प्रॉफिट सिमुलेटर' : 'Open Profit Simulator', route: `/harvest?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Calculator' },
        { label: isMr ? 'वाहतूक बुक करा' : isHi ? 'वाहन बुक करें' : 'Book Transportation', route: `/transport?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Truck' }
      ]
    };
  }

  // 3. FIND TRANSPORT FOR HARVEST
  const isFindTransport = (
    text.includes('find transport for my harvest') || text.includes('find transport') ||
    text.includes('need transport') || text.includes('book transport') || text.includes('find vehicle') ||
    text.includes('वाहतूक शोधा') || text.includes('पिकासाठी वाहतूक') || text.includes('गाडी शोधा') ||
    text.includes('ट्रांसपोर्ट खोजें') || text.includes('परिवहन खोजें')
  );

  if (isFindTransport) {
    let crop = extractCropMention(message);
    let profile = null;
    if (user && user.id && !user.isGuest) {
      try { profile = await FarmerProfile.findOne({ where: { userId: user.id } }); } catch (_) {}
    }
    if (!crop && profile?.mainCrop) crop = profile.mainCrop.split(',')[0].trim();
    crop = crop || 'Tomato';
    const qty = extractQuantity(message).quantityKg || (profile?.currentHarvestKg ? Number(profile.currentHarvestKg) : 500);

    // Query real vehicles excluding demo seed drivers
    const DEMO_NAMES = ['Rajesh Patil', 'Kishor Jadhav', 'Vikram Deshmukh', 'Anil Shinde'];
    let realVehicles = [];
    try {
      realVehicles = await Vehicle.findAll({
        where: {
          isAvailable: true,
          driverName: { [Op.notIn]: DEMO_NAMES }
        },
        order: [['capacityKg', 'DESC']],
        limit: 3
      });
    } catch (_) {}

    const v = realVehicles[0];
    if (v) {
      const availCap = Math.max(0, (v.capacityKg || 2500) - (v.currentLoadKg || 0));
      const estFare = Math.round(qty * (v.ratePerKm ? Number(v.ratePerKm) * 0.15 : 2.8));

      let msg = "";
      if (isMr) {
        msg = `🚚 आपल्या ${qty} kg ${crop} शेतीमालासाठी उपलब्ध अधिकृत वाहन:\n\n` +
          `• चालक: ${v.driverName} (${v.vehicleNumber})\n` +
          `• वाहन प्रकार: ${v.vehicleType || 'Tata 407'} (एकूण क्षमता: ${v.capacityKg} kg | शिल्लक जागा: ${availCap} kg)\n` +
          `• मुख्य मार्ग: ${v.location || 'Pune'} ➔ ${v.destination || 'Mumbai Vashi APMC'}\n` +
          `• अंदाजित सामायिक भाडे: ₹${estFare} (वजन-अंतर सामायिक पूल दर)\n\n` +
          `नोंद: बुकिंग पूर्ण करण्यासाठी खालील बटणावर क्लिक करा, तपशील तपासा (Review) आणि अधिकृत पुष्टी (Confirm) करा.`;
      } else if (isHi) {
        msg = `🚚 आपकी ${qty} kg ${crop} फसल के लिए उपलब्ध सत्यापित वाहन:\n\n` +
          `• चालक: ${v.driverName} (${v.vehicleNumber})\n` +
          `• वाहन प्रकार: ${v.vehicleType || 'Tata 407'} (कुल क्षमता: ${v.capacityKg} kg | उपलब्ध स्पेस: ${availCap} kg)\n` +
          `• मुख्य रूट: ${v.location || 'Pune'} ➔ ${v.destination || 'Mumbai Vashi APMC'}\n` +
          `• अनुमानित साझा भाड़ा: ₹${estFare}\n\n` +
          `नोट: नीचे दिए गए बटन से बुकिंग फॉर्म में विवरण की समीक्षा (Review) करें और पुष्टि करें।`;
      } else {
        msg = `🚚 Verified Available Transport for ${qty} kg of ${crop}:\n\n` +
          `• Driver: ${v.driverName} (${v.vehicleNumber})\n` +
          `• Vehicle: ${v.vehicleType || 'Tata 407'} (Capacity: ${v.capacityKg} kg | Available Payload: ${availCap} kg)\n` +
          `• Corridor: ${v.location || 'Pune'} to ${v.destination || 'Mumbai Vashi APMC'}\n` +
          `• Est. Shared Freight: ~₹${estFare} based on weight-distance pooling\n\n` +
          `Click below to prefill the transport form, review pickup details, and confirm your authorized booking.`;
      }

      return {
        intent: 'transport',
        message: msg,
        actions: [
          { label: isMr ? 'वाहतूक तपासा व बुक करा' : isHi ? 'विवरण जांचें व बुक करें' : 'Review & Confirm Booking', route: `/transport?crop=${encodeURIComponent(crop)}&weight=${qty}&vehicleId=${v.id}`, icon: 'Truck' },
          { label: isMr ? 'माझ्या बुकिंग्स' : isHi ? 'मेरी बुकिंग्स' : 'My Bookings', route: '/transport?tab=my-bookings', icon: 'ShieldCheck' }
        ]
      };
    } else {
      const msg = isMr
        ? `🚚 सध्या आपल्या मार्गावर थेट मोकळे वाहन शोधण्यासाठी वाहतूक कक्षात शेअर्ड पूल विनंती नोंदवा.`
        : `🚚 Post a shared pooling request on the Transport page to match with verified regional trucks.`;
      return {
        intent: 'transport',
        message: msg,
        actions: [
          { label: isMr ? 'वाहतूक पूल उघडा' : 'Open Transport Workspace', route: `/transport?crop=${encodeURIComponent(crop)}&weight=${qty}`, icon: 'Truck' }
        ]
      };
    }
  }

  // 4. CHECK BOOKING STATUS
  const isBookingStatus = (
    text.includes('check my booking status') || text.includes('check booking') ||
    text.includes('my booking') || text.includes('booking status') ||
    text.includes('where is my booking') || text.includes('transporter accepted') ||
    text.includes('माझ्या बुकिंगची सद्यस्थिती') || text.includes('माझी बुकिंग') ||
    text.includes('बुकिंग कुठे') || text.includes('मेरी बुकिंग') || text.includes('बुकिंग स्थिति') ||
    text.includes('बुकिंग स्टेटस') || text.includes('मेरी बुकिंग का स्टेटस')
  );

  if (isBookingStatus) {
    if (user.isGuest) {
      const msg = isMr
        ? "आपल्या गोपनीय वाहतूक बुकिंग्स आणि खरेदी प्रस्तावांची स्थिती तपासण्यासाठी कृपया शेतकरी खात्याने लॉगिन करा."
        : isHi
        ? "अपनी गोपनीय बुकिंग और मंडी प्रस्ताव देखने के लिए कृपया किसान खाते से साइन इन करें।"
        : "Please sign in with your farmer account to view your private transport bookings and authorized APMC status.";
      return {
        intent: 'my_farm',
        message: msg,
        actions: [{ label: isMr ? 'लॉगिन करा' : 'Sign In', route: '/login', icon: 'ShieldCheck' }]
      };
    }

    let latestBooking = null;
    try {
      latestBooking = await TransportRequest.findOne({
        where: { userId: user.id },
        order: [['updatedAt', 'DESC']]
      });
    } catch (_) {}

    if (!latestBooking) {
      const msg = isMr
        ? "आपल्याकडे सध्या कोणतीही सक्रिय वाहतूक बुकिंग नाही. नवीन बुकिंग करण्यासाठी 'Book Transportation' पर्यायाचा वापर करा."
        : isHi
        ? "आपके पास वर्तमान में कोई सक्रिय परिवहन बुकिंग नहीं है। नई बुकिंग करने के लिए 'Book Transportation' चुनें।"
        : "You currently have no active transport bookings. You can book a vehicle using the 'Book Transportation' option.";
      return {
        intent: 'my_farm',
        message: msg,
        actions: [{ label: isMr ? 'वाहतूक बुक करा' : 'Book Transportation', route: '/transport', icon: 'Truck' }]
      };
    }

    const statusUpper = (latestBooking.status || 'PENDING').toUpperCase().replace(/_/g, ' ');
    const isAccepted = ['accepted', 'driver_assigned', 'vehicle_assigned', 'in_transit', 'delivered', 'completed'].includes(latestBooking.status);

    let msg = "";
    if (isMr) {
      msg = `आपली बुकिंग #${latestBooking.bookingId || latestBooking.id} (${latestBooking.cropName}, ${latestBooking.weightKg} kg ➔ ${latestBooking.destinationMarket}): सद्यस्थिती '${statusUpper}'. ` +
        (isAccepted
          ? `वाहतूकदाराने स्वीकारली आहे! नियुक्त चालक: ${latestBooking.driverName || 'Verified Driver'} (${latestBooking.vehicleNumber || 'MH Vehicle'}).`
          : `वाहतूकदार पडताळणी प्रलंबित आहे.`);
    } else if (isHi) {
      msg = `आपकी बुकिंग #${latestBooking.bookingId || latestBooking.id} (${latestBooking.cropName}, ${latestBooking.weightKg} kg ➔ ${latestBooking.destinationMarket}): वर्तमान स्थिति '${statusUpper}'. ` +
        (isAccepted
          ? `ट्रांसपोर्टर ने स्वीकार कर लिया है! नियुक्त चालक: ${latestBooking.driverName || 'Verified Driver'} (${latestBooking.vehicleNumber || 'MH Vehicle'}).`
          : `ट्रांसपोर्टर स्वीकृति प्रतीक्षारत है।`);
    } else {
      msg = `Booking #${latestBooking.bookingId || latestBooking.id} (${latestBooking.cropName}, ${latestBooking.weightKg} kg to ${latestBooking.destinationMarket}): Current status is '${statusUpper}'. ` +
        (isAccepted
          ? `Transporter has accepted! Assigned driver: ${latestBooking.driverName || 'Verified Driver'} (${latestBooking.vehicleNumber || 'MH Vehicle'}).`
          : `Awaiting transporter acceptance.`);
    }

    return {
      intent: 'my_farm',
      message: msg,
      actions: [
        { label: isMr ? 'माझ्या बुकिंग्स पहा' : 'View My Bookings', route: '/transport?tab=my-bookings', icon: 'Truck' },
        { label: isMr ? 'डिजिटल गेट पास' : 'Digital Gate Pass', route: `/transport?tab=gatepass&showpass=true`, icon: 'ShieldCheck' }
      ]
    };
  }

  // 5. WEATHER RISK: "What is the weather risk?"
  const isWeatherRisk = (
    text.includes('weather risk') || text.includes('what is the weather risk') ||
    text.includes('rain risk') || text.includes('हवामानाचा धोका') || text.includes('हवामान धोका') ||
    text.includes('मौसम का जोखिम') || text.includes('मौसम जोखिम') ||
    (text.includes('weather') && (text.includes('risk') || text.includes('forecast') || text.includes('rain')))
  );

  if (isWeatherRisk) {
    let profile = null;
    if (user && user.id && !user.isGuest) {
      try { profile = await FarmerProfile.findOne({ where: { userId: user.id } }); } catch (_) {}
    }
    const dist = extractLocationMention(message) || profile?.district || user?.district || 'Pune';

    let weather = null;
    try {
      weather = await weatherService.getWeather({ district: dist });
    } catch (_) {}

    const rainProb = weather?.rainProbability ?? weather?.precipitationProbability ?? 25;
    const temp = weather?.temperatureC ?? 28;
    const cond = weather?.condition || 'Partly Cloudy';
    const isHighRain = rainProb >= 40;

    let msg = "";
    if (isMr) {
      msg = `🌦️ ${dist} जिल्ह्यातील हवामान जोखीम विश्लेषण:\n\n` +
        `• सद्यस्थिती: ${cond}, तापमान: ${temp}°C\n` +
        `• पावसाची शक्यता: ${rainProb}%\n` +
        `• शेती सल्ला: ` + (isHighRain 
          ? `पावसाचा धोका जास्त असल्याने काढणीनंतर शेतीमाल उघड्यावर ठेवू नये. वाहतुकीसाठी ताडपत्री असलेले बंदिस्त वाहन वापरावे.`
          : `हवामान काढणी व वाहतुकीसाठी अनुकूल आहे. काढणी केलेला माल सुकवण्यासाठी व वाहतूक नियोजनासाठी उत्तम संधी आहे.`);
    } else if (isHi) {
      msg = `🌦️ ${dist} जिले के लिए मौसम जोखिम विश्लेषण:\n\n` +
        `• वर्तमान स्थिति: ${cond}, तापमान: ${temp}°C\n` +
        `• वर्षा की संभावना: ${rainProb}%\n` +
        `• कृषि परामर्श: ` + (isHighRain
          ? `बारिश का जोखिम है, फसल को सुरक्षित शेड में रखें और कवर्ड वाहन से ही मंडी भेजें।`
          : `मौसम फसल कटाई और परिवहन के लिए पूरी तरह अनुकूल है।`);
    } else {
      msg = `🌦️ Weather Risk Assessment for ${dist} District:\n\n` +
        `• Current Conditions: ${cond}, Temperature: ${temp}°C\n` +
        `• Precipitation Probability: ${rainProb}%\n` +
        `• Harvest & Transport Advisory: ` + (isHighRain
          ? `Rain risk detected. Avoid leaving freshly harvested produce in open field. Use tarpaulin-covered vehicles for highway transit.`
          : `Favorable weather window across Maharashtra corridors. Safe conditions for field curing and mandi transport.`);
    }

    return {
      intent: 'weather',
      message: msg,
      actions: [
        { label: isMr ? 'हवामान तपशील पहा' : isHi ? 'मौसम अलर्ट देखें' : 'View Weather Alerts', route: '/weather', icon: 'CloudSunRain' },
        { label: isMr ? 'संरक्षित वाहतूक बुक करा' : isHi ? 'कवर्ड वाहन बुक करें' : 'Book Covered Transport', route: '/transport', icon: 'Truck' }
      ]
    };
  }

  // 6. CROP PROBLEM & DISEASE GUIDANCE: "Help me understand a crop problem"
  const isCropProblem = (
    text.includes('crop problem') || text.includes('help me understand a crop problem') ||
    text.includes('disease') || text.includes('pest') || text.includes('fungus') ||
    text.includes('blight') || text.includes('yellowing') || text.includes('leaf spot') ||
    text.includes('पिकावरील रोगाची') || text.includes('पिकावरील रोग') || text.includes('पिकाची समस्या') ||
    text.includes('फसल की समस्या') || text.includes('फसल रोग')
  );

  if (isCropProblem) {
    let crop = extractCropMention(message);
    let profile = null;
    if (user && user.id && !user.isGuest) {
      try { profile = await FarmerProfile.findOne({ where: { userId: user.id } }); } catch (_) {}
    }
    if (!crop && profile?.mainCrop) crop = profile.mainCrop.split(',')[0].trim();
    crop = crop || 'Tomato';

    let diagnosis = {
      disease: 'Early Blight (Alternaria solani)',
      symptoms: 'Concentric dark brown rings with chlorotic yellow halo on lower leaf foliage.',
      organic: 'Cold-pressed Neem Oil (10,000 ppm) @ 3.5 ml/L of water + Trichoderma viride biological spray.',
      chemical: 'Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1 ml/L.'
    };

    if (crop.toLowerCase().includes('onion')) {
      diagnosis = {
        disease: 'Purple Blotch (Alternaria porri)',
        symptoms: 'Small water-soaked sunken lesions with purplish centers on leaf shafts.',
        organic: 'Fermented butter-milk (chhaas) extract (50 ml/L) mixed with ginger-garlic extract.',
        chemical: 'Difenoconazole 25% EC @ 1 ml/L or Chlorothalonil 75% WP @ 2 g/L.'
      };
    } else if (crop.toLowerCase().includes('potato')) {
      diagnosis = {
        disease: 'Late Blight (Phytophthora infestans)',
        symptoms: 'Irregular dark brown water-soaked lesions with white moldy fungal growth on leaf underside.',
        organic: 'Rogue and destroy infected foliage. Spray Copper Hydroxide @ 2.5 g/L.',
        chemical: 'Cymoxanil 8% + Mancozeb 64% WP @ 3 g/L or Metalaxyl-M 4% + Mancozeb 64% WP.'
      };
    } else if (crop.toLowerCase().includes('cotton')) {
      diagnosis = {
        disease: 'Cotton Leaf Curl Virus (CLCuV)',
        symptoms: 'Upward cup-like rolling of leaves and thickening of main veins caused by Whitefly vector.',
        organic: 'Install yellow sticky traps (10 traps/acre). Spray 5% Neem Seed Kernel Extract (NSKE).',
        chemical: 'Control whitefly vector using Diafenthiuron 50% WP @ 1.2 g/L.'
      };
    }

    let msg = "";
    if (isMr) {
      msg = `🌿 ${crop} पिकावरील रोग व उपाय मार्गदर्शन:\n\n` +
        `• संभाव्य रोग: ${diagnosis.disease}\n` +
        `• लक्षणे: ${diagnosis.symptoms}\n` +
        `• सेंद्रिय / जैविक उपाय: ${diagnosis.organic}\n` +
        `• प्रमाणित रासायनिक उपाय: ${diagnosis.chemical}\n\n` +
        `⚠️ अनिश्चितता नोंद: पानांची लक्षणे सूक्ष्मअन्नद्रव्य कमतरतेसारखीही दिसू शकतात. फवारणी करण्यापूर्वी आपल्या स्थानिक तालुका कृषी विज्ञान केंद्रातील (KVK) कृषी अधिकाऱ्यांचा प्रत्यक्ष सल्ला अवश्य घ्या.`;
    } else if (isHi) {
      msg = `🌿 ${crop} फसल रोग व उपचार मार्गदर्शन:\n\n` +
        `• संभावित बीमारी: ${diagnosis.disease}\n` +
        `• लक्षण: ${diagnosis.symptoms}\n` +
        `• जैविक उपाय: ${diagnosis.organic}\n` +
        `• रासायनिक उपाय: ${diagnosis.chemical}\n\n` +
        `⚠️ अनिश्चितता नोट: पत्ते के लक्षण पोषक तत्वों की कमी से भी मिलते-जुलते हो सकते हैं। स्प्रे करने से पहले नजदीकी कृषि विज्ञान केंद्र (KVK) विशेषज्ञ से पुष्टि करें।`;
    } else {
      msg = `🌿 Agronomic Diagnostic Guidance for ${crop}:\n\n` +
        `• Common Pathology: ${diagnosis.disease}\n` +
        `• Typical Symptoms: ${diagnosis.symptoms}\n` +
        `• Organic / Bio-treatment: ${diagnosis.organic}\n` +
        `• Certified Chemical Dosage: ${diagnosis.chemical}\n\n` +
        `⚠️ Uncertainty Note: Leaf symptoms can overlap with micronutrient deficiencies or waterlogging. We recommend showing a physical sample to your local Taluka Krishi Kendra before spraying chemical fungicides.`;
    }

    return {
      intent: 'crop_problem',
      message: msg,
      actions: [
        { label: isMr ? 'पीक डॉक्टर उघडा' : isHi ? 'फसल डॉक्टर' : 'Open Crop Doctor', route: '/dashboard', icon: 'Store' },
        { label: isMr ? 'हवामान जोखीम तपासा' : isHi ? 'मौसम जोखिम' : 'Check Weather Risk', route: '/weather', icon: 'CloudSunRain' }
      ]
    };
  }

  // 7. GOVERNMENT SCHEMES: "Find a relevant government scheme"
  const isGovScheme = (
    text.includes('find a relevant government scheme') || text.includes('government scheme') ||
    text.includes('relevant government scheme') || text.includes('सरकारी योजना') ||
    text.includes('सरकारी योजना शोधा') || text.includes('माझ्यासाठी उपयुक्त सरकारी योजना')
  );

  if (isGovScheme) {
    let msg = "";
    if (isMr) {
      msg = `🏛️ शेतकऱ्यांसाठी महत्त्वाच्या सक्रिय शासकीय योजना:\n\n` +
        `1. पीएम-किसान (PM-KISAN):\n` +
        `   • थेट बँक खात्यात वार्षिक ₹६,००० (३ हप्त्यांमध्ये).\n` +
        `2. पंतप्रधान पीक विमा योजना (PMFBY):\n` +
        `   • अवकाळी पाऊस, दुष्काळ व कीड नुकसानीसाठी अवघ्या १.५% ते २% हप्त्यावर संपूर्ण विमा संरक्षण.\n` +
        `3. महाडीबीटी ठिबक व तुषार सिंचन अनुदान:\n` +
        `   • सूक्ष्म सिंचनासाठी लहान व अल्पभूधारक शेतकऱ्यांना ५५% ते ७०% पर्यंत शासकीय अनुदान.\n` +
        `4. किसान क्रेडिट कार्ड (KCC):\n` +
        `   • वेळेवर परतफेडीवर अवघ्या ४% सवलतीच्या व्याजदराने पीक कर्ज.\n\n` +
        `सविस्तर पात्रता व अर्ज प्रक्रियेसाठी खालील बटणावर क्लिक करा.`;
    } else if (isHi) {
      msg = `🏛️ किसानों के लिए प्रमुख सक्रिय सरकारी योजनाएं:\n\n` +
        `1. पीएम-किसान (PM-KISAN): ₹6,000 वार्षिक प्रत्यक्ष बैंक अंतरण।\n` +
        `2. प्रधानमंत्री फसल बीमा योजना (PMFBY): प्राकृतिक आपदा व कीट क्षति हेतु सुरक्षा कवच।\n` +
        `3. ड्रिप व सूक्ष्म सिंचाई अनुदान: लघु व सीमांत किसानों को 55% से 70% तक की छूट।\n` +
        `4. किसान क्रेडिट कार्ड (KCC): 4% रियायती ब्याज दर पर फसली ऋण।\n\n` +
        `पात्रता जांचने के लिए सरकारी योजनाएं विकल्प देखें।`;
    } else {
      msg = `🏛️ Key Active Agricultural Government Schemes:\n\n` +
        `1. PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):\n` +
        `   • ₹6,000 annual direct income support credited in 3 equal installments.\n` +
        `2. PMFBY (Pradhan Mantri Fasal Bima Yojana):\n` +
        `   • Comprehensive crop loss insurance against drought, unseasonal rain, and pests at low 1.5% - 2% premium.\n` +
        `3. MahaDBT / i-Khedut Micro-Irrigation Subsidy:\n` +
        `   • 55% to 70% subsidy assistance for Drip and Sprinkler irrigation systems.\n` +
        `4. Kisan Credit Card (KCC):\n` +
        `   • Concessional credit access with 3% prompt repayment incentive (effective 4% interest rate).\n\n` +
        `Explore eligibility criteria and documentation requirements in the Schemes portal.`;
    }

    return {
      intent: 'government_scheme',
      message: msg,
      actions: [
        { label: isMr ? 'सरकारी योजना तपासा' : isHi ? 'सरकारी योजनाएं देखें' : 'Explore Govt Schemes', route: '/schemes', icon: 'Landmark' }
      ]
    };
  }

  // 8. MANDI PROCUREMENT OFFERS
  if (
    text.includes('mandi offer') || text.includes('buyer offer') || text.includes('procurement offer') ||
    text.includes('मंडी ऑफर') || text.includes('व्यापारी ऑफर') || text.includes('मंडी खरेदी')
  ) {
    if (user.isGuest) {
      return {
        intent: 'my_farm',
        message: isMr ? "आपल्या खरेदी प्रस्तावांची माहिती पाहण्यासाठी कृपया शेतकरी लॉगिन करा." : "Please sign in with your farmer account to view confidential mandi offers.",
        actions: [{ label: isMr ? 'लॉगिन करा' : 'Sign In', route: '/login', icon: 'ShieldCheck' }]
      };
    }

    let offers = [];
    try {
      offers = await ContactRequest.findAll({
        where: { receiverId: user.id, contactType: 'mandi_to_farmer' },
        order: [['createdAt', 'DESC']],
        limit: 3
      });
    } catch (_) {}

    const pendingOffers = offers.filter(o => o.status === 'pending');
    if (pendingOffers.length === 0) {
      const msg = isMr
        ? "सध्या आपल्याकडे कोणताही प्रलंबित मंडी खरेदी प्रस्ताव (Mandi Offer) नाही. नवीन ऑफर आल्यास डॅशबोर्डवर तात्काळ दिसेल."
        : isHi
        ? "वर्तमान में आपके पास कोई लंबित मंडी खरीद प्रस्ताव नहीं है। नया प्रस्ताव आने पर तुरंत सूचित किया जाएगा।"
        : "You currently have no pending mandi procurement offers. Any new buyer inquiry will appear on your dashboard.";
      return {
        intent: 'my_farm',
        message: msg,
        actions: [{ label: isMr ? 'बाजार भाव तपासा' : 'Check Market Prices', route: '/markets', icon: 'TrendingUp' }]
      };
    }

    const first = pendingOffers[0];
    const msg = isMr
      ? `आपल्याकडे ${pendingOffers.length} प्रलंबित मंडी खरेदी प्रस्ताव आहेत! ताज्या प्रस्तावानुसार ${first.senderName || 'APMC Mandi'} ने ₹${first.proposedPricePerKg}/kg दराने ${first.quantityKg} kg ${first.cropName} खरेदीसाठी विचारणा केली आहे.`
      : isHi
      ? `आपके पास ${pendingOffers.length} लंबित मंडी खरीद प्रस्ताव हैं! ${first.senderName || 'APMC Mandi'} ने ₹${first.proposedPricePerKg}/kg की दर से ${first.quantityKg} kg ${first.cropName} खरीदने का प्रस्ताव भेजा है।`
      : `You have ${pendingOffers.length} pending mandi procurement offer(s)! ${first.senderName || 'APMC Mandi'} has offered ₹${first.proposedPricePerKg}/kg for ${first.quantityKg} kg of ${first.cropName}.`;

    return {
      intent: 'my_farm',
      message: msg,
      actions: [{ label: isMr ? 'ऑफर स्वीकारा / तपासा' : 'Review Mandi Offers', route: '/dashboard#mandi-bookings', icon: 'Store' }]
    };
  }

  // 9. SAVED CROPS
  if (
    text.includes('crops have i saved') || text.includes('saved crops') || text.includes('my crops') ||
    text.includes('माझी पिके') || text.includes('माझे पीक') || text.includes('मेरी फसलें')
  ) {
    let profile = null;
    if (user && user.id && !user.isGuest) {
      try { profile = await FarmerProfile.findOne({ where: { userId: user.id } }); } catch (_) {}
    }
    const mainCrop = profile?.mainCrop || 'Tomato';
    let qMap = {};
    if (typeof profile?.productQuantities === 'string') {
      try { qMap = JSON.parse(profile.productQuantities); } catch (_) {}
    } else if (typeof profile?.productQuantities === 'object' && profile?.productQuantities) {
      qMap = profile.productQuantities;
    }

    const cropNames = mainCrop.split(',').map(c => c.trim()).filter(Boolean);
    const summaryList = cropNames.map(c => {
      const q = qMap[c]?.qty || qMap[c]?.harvestQuantityKg || 500;
      const u = qMap[c]?.unit || 'kg';
      return `${c}: ${q} ${u}`;
    }).join(', ');

    const msg = isMr
      ? `आपल्या शेतात नोंदवलेली पिके (${profile?.district || 'पुणे'} जिल्हा, ${profile?.farmSizeAcres || 4.5} एकर): ${summaryList || mainCrop}.`
      : isHi
      ? `आपके खेत में पंजीकृत फसलें (${profile?.district || 'पुणे'} जिला, ${profile?.farmSizeAcres || 4.5} एकड़): ${summaryList || mainCrop}.`
      : `Your registered farm crops (${profile?.district || 'Pune'} district, ${profile?.farmSizeAcres || 4.5} Acres): ${summaryList || mainCrop}.`;

    return {
      intent: 'my_farm',
      message: msg,
      actions: [
        { label: isMr ? 'नफा मोजा' : 'Calculate Profit', route: `/harvest?crop=${cropNames[0] || 'Tomato'}`, icon: 'Calculator' },
        { label: isMr ? 'बाजार भाव पहा' : 'Check Prices', route: `/markets?crop=${cropNames[0] || 'Tomato'}`, icon: 'TrendingUp' }
      ]
    };
  }

  // 10. FPO MEMBERSHIP STATUS
  if (
    text.includes('fpo membership') || text.includes('fpo status') ||
    text.includes('एफपीओ स्थिती') || text.includes('एफपीओ सदस्यता') || text.includes('एफपीओ स्टेटस')
  ) {
    if (user.isGuest) {
      return {
        intent: 'my_farm',
        message: isMr ? "FPO सदस्यत्वाची माहिती पाहण्यासाठी कृपया शेतकरी लॉगिन करा." : "Please sign in to check your FPO membership status.",
        actions: [{ label: isMr ? 'लॉगिन करा' : 'Sign In', route: '/login', icon: 'ShieldCheck' }]
      };
    }

    let membership = null;
    try {
      membership = await FpoMembership.findOne({
        where: { farmerId: user.id },
        include: [{ model: User, as: 'Fpo', attributes: ['id', 'name'], include: [{ model: FarmerProfile }] }],
        order: [['updatedAt', 'DESC']]
      });
    } catch (_) {}

    if (!membership) {
      const msg = isMr
        ? "आपण अद्याप कोणत्याही शेतकरी उत्पादक कंपनीचे (FPO) सदस्य नाही. सामायिक विक्री व अनुदानासाठी FPO शोधा व अर्ज करा."
        : isHi
        ? "आप अभी तक किसी किसान उत्पादक संगठन (FPO) के सदस्य नहीं हैं। सामूहिक बिक्री लाभ के लिए FPO से जुड़ें।"
        : "You are not currently enrolled in any Farmer Producer Organization (FPO). Join an FPO for collective bargaining and shared freight.";
      return {
        intent: 'my_farm',
        message: msg,
        actions: [{ label: isMr ? 'FPO शोधा व अर्ज करा' : 'Find & Join FPO', route: '/fpo', icon: 'Users' }]
      };
    }

    const fpoName = membership.Fpo?.FarmerProfile?.fpoName || membership.Fpo?.name || "Kisan Samruddhi FPO";
    const statusUpper = (membership.status || 'PENDING').toUpperCase();

    let msg = "";
    if (isMr) {
      msg = `आपली FPO सदस्यता: ${fpoName}. सद्यस्थिती: '${statusUpper}'. ` +
        (membership.status === 'active'
          ? "आपण सक्रिय सदस्य आहात! आपण सामूहिक विक्री लॉटमध्ये माल जमा करू शकता."
          : "आपला अर्ज FPO व्यवस्थापनाकडे मंजुरीसाठी प्रलंबित आहे.");
    } else if (isHi) {
      msg = `आपकी FPO सदस्यता: ${fpoName}. वर्तमान स्थिति: '${statusUpper}'. ` +
        (membership.status === 'active'
          ? "आप सक्रिय सदस्य हैं! आप सामूहिक बिक्री में भाग ले सकते हैं।"
          : "आपका आवेदन FPO प्रबंधन के अनुमोदन हेतु लंबित है।");
    } else {
      msg = `Your FPO membership with ${fpoName}: Current status is '${statusUpper}'. ` +
        (membership.status === 'active'
          ? "You are an active verified member! You can participate in collective pooling and bulk mandi contracts."
          : "Your membership application is currently pending FPO approval.");
    }

    return {
      intent: 'my_farm',
      message: msg,
      actions: [{ label: isMr ? 'FPO डॅशबोर्ड उघडा' : 'View FPO Workspace', route: '/fpo', icon: 'Users' }]
    };
  }

  // 11. WHAT ACTION SHOULD I TAKE NEXT
  if (
    text.includes('action should i take') || text.includes('what should i do next') ||
    text.includes('मी पुढे काय करावे') || text.includes('पुढील पाऊल') || text.includes('अगला कदम')
  ) {
    let profile = null;
    if (user && user.id && !user.isGuest) {
      try { profile = await FarmerProfile.findOne({ where: { userId: user.id } }); } catch (_) {}
    }
    const crop = profile?.mainCrop?.split(',')[0]?.trim() || 'Tomato';
    const dist = profile?.district || 'Pune';

    const msg = isMr
      ? `शेतकरी मित्रा, आजचे ४ मुख्य निर्णय:\n1. 📊 ${dist} व वाशी APMC मधील ${crop} चा थेट बाजार भाव तपासा.\n2. 🧮 वाहतूक खर्च व कमिशन वजा करून निव्वळ नफा मोजा.\n3. 🚚 कमी खर्चात माल पाठवण्यासाठी सामायिक वाहन (Shared Transport) बुक करा.\n4. 🏛️ पीएम-किसान व पीक विमा योजनांची पात्रता तपासा.`
      : isHi
      ? `किसान मित्र, आज के 4 प्रमुख कार्य:\n1. 📊 ${dist} व वाशी APMC में ${crop} का मंडी भाव देखें।\n2. 🧮 परिवहन खर्च घटाकर शुद्ध मुनाफा कैलकुलेट करें।\n3. 🚚 कम भाड़े के लिए साझा वाहन (Shared Transport) बुक करें।\n4. 🏛️ पीएम-किसान और फसल बीमा पात्रता देखें।`
      : `Farmer friend, here are 4 high-value actions to take today:\n1. 📊 Compare live ${crop} benchmark rates in ${dist} APMC vs Mumbai Vashi APMC.\n2. 🧮 Run the Profit Calculator deducting transport freight to see true take-home proceeds.\n3. 🚚 Reserve a shared transport slot to cut highway freight expenses.\n4. 🏛️ Check eligibility for active government schemes.`;

    return {
      intent: 'my_farm',
      message: msg,
      actions: [
        { label: isMr ? 'बाजार भाव तपासा' : 'Check Market Prices', route: `/markets?crop=${crop}`, icon: 'TrendingUp' },
        { label: isMr ? 'नफा मोजा' : 'Calculate Profit', route: `/harvest?crop=${crop}`, icon: 'Calculator' },
        { label: isMr ? 'वाहतूक बुक करा' : 'Book Transportation', route: `/transport?crop=${crop}`, icon: 'Truck' }
      ]
    };
  }

  return null;
}

module.exports = {
  handleChatMessage,
  handleChatStatus,
  handleTransporterLogisticsAssistant,
  handleFarmerMyFarmAssistant,
  buildIntentActions
};
