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

    // Authenticated Farmer: Check My Farm queries (booking status, mandi offers, saved crops, FPO status, next action)
    if (req.user) {
      const myFarmResult = await handleFarmerMyFarmAssistant({
        user: req.user,
        message: cleanMessage,
        language: resolvedLang
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
            intent: 'my_farm',
            language: resolvedLang,
            model: 'HarvestMitra-FarmCopilot-v2'
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

async function handleFarmerMyFarmAssistant({ user, message, language }) {
  if (!user || !user.id) return null;
  const text = String(message || '').toLowerCase();
  const { TransportRequest, ContactRequest, FarmerProfile, FpoMembership, User } = require('../models');

  // 1. Where is my booking? Has transporter accepted?
  if (
    text.includes('my booking') || text.includes('where is my booking') ||
    text.includes('transporter accepted') || text.includes('booking status') ||
    text.includes('माझी बुकिंग') || text.includes('बुकिंग कुठे') || text.includes('मेरी बुकिंग') || text.includes('बुकिंग स्थिति')
  ) {
    const latestBooking = await TransportRequest.findOne({
      where: { userId: user.id },
      order: [['updatedAt', 'DESC']]
    });

    if (!latestBooking) {
      const msg = language === 'mr'
        ? "आपल्याकडे सध्या कोणतीही सक्रिय वाहतूक बुकिंग नाही. नवीन बुकिंग करण्यासाठी 'Book Transportation' पर्यायाचा वापर करा."
        : language === 'hi'
        ? "आपके पास वर्तमान में कोई सक्रिय परिवहन बुकिंग नहीं है। नई बुकिंग करने के लिए 'Book Transportation' चुनें।"
        : "You currently have no active transport bookings. You can book a vehicle using the 'Book Transportation' option.";
      return {
        message: msg,
        actions: [{ label: language === 'mr' ? 'वाहतूक बुक करा' : 'Book Transportation', route: '/transport', icon: 'Truck' }]
      };
    }

    const statusUpper = (latestBooking.status || 'PENDING').toUpperCase().replace(/_/g, ' ');
    const isAccepted = ['accepted', 'driver_assigned', 'vehicle_assigned', 'in_transit', 'delivered', 'completed'].includes(latestBooking.status);

    let msg = "";
    if (language === 'mr') {
      msg = `आपली बुकिंग #${latestBooking.bookingId || latestBooking.id} (${latestBooking.cropName}, ${latestBooking.weightKg} kg ➔ ${latestBooking.destinationMarket}): सद्यस्थिती '${statusUpper}'. ` +
        (isAccepted
          ? `वाहतूकदाराने स्वीकारली आहे! नियुक्त चालक: ${latestBooking.driverName || 'Verified Driver'} (${latestBooking.vehicleNumber || 'MH Vehicle'}).`
          : `वाहतूकदार पडताळणी प्रलंबित आहे.`);
    } else if (language === 'hi') {
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
      message: msg,
      actions: [
        { label: language === 'mr' ? 'माझ्या बुकिंग्स पहा' : 'View My Bookings', route: '/transport?tab=my-bookings', icon: 'Truck' },
        { label: language === 'mr' ? 'डिजिटल गेट पास' : 'Digital Gate Pass', route: `/transport?tab=gatepass&showpass=true`, icon: 'ShieldCheck' }
      ]
    };
  }

  // 2. Do I have a mandi offer? Mandi inquiries
  if (
    text.includes('mandi offer') || text.includes('buyer offer') || text.includes('procurement offer') ||
    text.includes('मंडी ऑफर') || text.includes('व्यापारी ऑफर') || text.includes('मंडी खरेदी')
  ) {
    const offers = await ContactRequest.findAll({
      where: { receiverId: user.id, contactType: 'mandi_to_farmer' },
      order: [['createdAt', 'DESC']],
      limit: 3
    });

    const pendingOffers = offers.filter(o => o.status === 'pending');
    if (pendingOffers.length === 0) {
      const msg = language === 'mr'
        ? "सध्या आपल्याकडे कोणताही प्रलंबित मंडी खरेदी प्रस्ताव (Mandi Offer) नाही. नवीन ऑफर आल्यास डॅशबोर्डवर तात्काळ दिसेल."
        : language === 'hi'
        ? "वर्तमान में आपके पास कोई लंबित मंडी खरीद प्रस्ताव नहीं है। नया प्रस्ताव आने पर तुरंत सूचित किया जाएगा।"
        : "You currently have no pending mandi procurement offers. Any new buyer inquiry will appear on your dashboard.";
      return {
        message: msg,
        actions: [{ label: language === 'mr' ? 'बाजार भाव तपासा' : 'Check Market Prices', route: '/markets', icon: 'TrendingUp' }]
      };
    }

    const first = pendingOffers[0];
    const msg = language === 'mr'
      ? `आपल्याकडे ${pendingOffers.length} प्रलंबित मंडी खरेदी प्रस्ताव आहेत! ताज्या प्रस्तावानुसार ${first.senderName || 'APMC Mandi'} ने ₹${first.proposedPricePerKg}/kg दराने ${first.quantityKg} kg ${first.cropName} खरेदीसाठी विचारणा केली आहे.`
      : language === 'hi'
      ? `आपके पास ${pendingOffers.length} लंबित मंडी खरीद प्रस्ताव हैं! ${first.senderName || 'APMC Mandi'} ने ₹${first.proposedPricePerKg}/kg की दर से ${first.quantityKg} kg ${first.cropName} खरीदने का प्रस्ताव भेजा है।`
      : `You have ${pendingOffers.length} pending mandi procurement offer(s)! ${first.senderName || 'APMC Mandi'} has offered ₹${first.proposedPricePerKg}/kg for ${first.quantityKg} kg of ${first.cropName}.`;

    return {
      message: msg,
      actions: [{ label: language === 'mr' ? 'ऑफर स्वीकारा / तपासा' : 'Review Mandi Offers', route: '/dashboard#mandi-bookings', icon: 'Store' }]
    };
  }

  // 3. What crops have I saved?
  if (
    text.includes('crops have i saved') || text.includes('saved crops') || text.includes('my crops') ||
    text.includes('माझी पिके') || text.includes('माझे पीक') || text.includes('मेरी फसलें')
  ) {
    const profile = await FarmerProfile.findOne({ where: { userId: user.id } });
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

    const msg = language === 'mr'
      ? `आपल्या शेतात नोंदवलेली पिके (${profile?.district || 'पुणे'} जिल्हा, ${profile?.farmSizeAcres || 4.5} एकर): ${summaryList || mainCrop}.`
      : language === 'hi'
      ? `आपके खेत में पंजीकृत फसलें (${profile?.district || 'पुणे'} जिला, ${profile?.farmSizeAcres || 4.5} एकड़): ${summaryList || mainCrop}.`
      : `Your registered farm crops (${profile?.district || 'Pune'} district, ${profile?.farmSizeAcres || 4.5} Acres): ${summaryList || mainCrop}.`;

    return {
      message: msg,
      actions: [
        { label: language === 'mr' ? 'नफा मोजा' : 'Calculate Profit', route: `/harvest?crop=${cropNames[0] || 'Tomato'}`, icon: 'Calculator' },
        { label: language === 'mr' ? 'बाजार भाव पहा' : 'Check Prices', route: `/markets?crop=${cropNames[0] || 'Tomato'}`, icon: 'TrendingUp' }
      ]
    };
  }

  // 4. What is my FPO membership status?
  if (
    text.includes('fpo membership') || text.includes('fpo status') ||
    text.includes('एफपीओ स्थिती') || text.includes('एफपीओ सदस्यता') || text.includes('एफपीओ स्टेटस')
  ) {
    const membership = await FpoMembership.findOne({
      where: { farmerId: user.id },
      include: [{ model: User, as: 'Fpo', attributes: ['id', 'name'], include: [{ model: FarmerProfile }] }],
      order: [['updatedAt', 'DESC']]
    });

    if (!membership) {
      const msg = language === 'mr'
        ? "आपण अद्याप कोणत्याही शेतकरी उत्पादक कंपनीचे (FPO) सदस्य नाही. सामायिक विक्री व अनुदानासाठी FPO शोधा व अर्ज करा."
        : language === 'hi'
        ? "आप अभी तक किसी किसान उत्पादक संगठन (FPO) के सदस्य नहीं हैं। सामूहिक बिक्री लाभ के लिए FPO से जुड़ें।"
        : "You are not currently enrolled in any Farmer Producer Organization (FPO). Join an FPO for collective bargaining and shared freight.";
      return {
        message: msg,
        actions: [{ label: language === 'mr' ? 'FPO शोधा व अर्ज करा' : 'Find & Join FPO', route: '/fpo', icon: 'Users' }]
      };
    }

    const fpoName = membership.Fpo?.FarmerProfile?.fpoName || membership.Fpo?.name || "Kisan Samruddhi FPO";
    const statusUpper = (membership.status || 'PENDING').toUpperCase();

    let msg = "";
    if (language === 'mr') {
      msg = `आपली FPO सदस्यता: ${fpoName}. सद्यस्थिती: '${statusUpper}'. ` +
        (membership.status === 'active'
          ? "आपण सक्रिय सदस्य आहात! आपण सामूहिक विक्री लॉटमध्ये माल जमा करू शकता."
          : "आपला अर्ज FPO व्यवस्थापनाकडे मंजुरीसाठी प्रलंबित आहे.");
    } else if (language === 'hi') {
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
      message: msg,
      actions: [{ label: language === 'mr' ? 'FPO डॅशबोर्ड उघडा' : 'View FPO Workspace', route: '/fpo', icon: 'Users' }]
    };
  }

  // 5. What action should I take next?
  if (
    text.includes('action should i take') || text.includes('what should i do next') ||
    text.includes('मी पुढे काय करावे') || text.includes('पुढील पाऊल') || text.includes('अगला कदम')
  ) {
    const profile = await FarmerProfile.findOne({ where: { userId: user.id } });
    const crop = profile?.mainCrop?.split(',')[0]?.trim() || 'Tomato';
    const dist = profile?.district || 'Pune';

    const msg = language === 'mr'
      ? `शेतकरी मित्रा, आजचे ४ मुख्य निर्णय:\n1. 📊 ${dist} व वाशी APMC मधील ${crop} चा थेट बाजार भाव तपासा.\n2. 🧮 वाहतूक खर्च व कमिशन वजा करून निव्वळ नफा मोजा.\n3. 🚚 कमी खर्चात माल पाठवण्यासाठी सामायिक वाहन (Shared Transport) बुक करा.\n4. 🏛️ पीएम-किसान व पीक विमा योजनांची पात्रता तपासा.`
      : language === 'hi'
      ? `किसान मित्र, आज के 4 प्रमुख कार्य:\n1. 📊 ${dist} व वाशी APMC में ${crop} का मंडी भाव देखें।\n2. 🧮 परिवहन खर्च घटाकर शुद्ध मुनाफा कैलकुलेट करें।\n3. 🚚 कम भाड़े के लिए साझा वाहन (Shared Transport) बुक करें।\n4. 🏛️ पीएम-किसान और फसल बीमा पात्रता देखें।`
      : `Farmer friend, here are 4 high-value actions to take today:\n1. 📊 Compare live ${crop} benchmark rates in ${dist} APMC vs Mumbai Vashi APMC.\n2. 🧮 Run the Profit Calculator deducting transport freight to see true take-home proceeds.\n3. 🚚 Reserve a shared transport slot to cut highway freight expenses.\n4. 🏛️ Check eligibility for active government schemes.`;

    return {
      message: msg,
      actions: [
        { label: language === 'mr' ? 'बाजार भाव तपासा' : 'Check Market Prices', route: `/markets?crop=${crop}`, icon: 'TrendingUp' },
        { label: language === 'mr' ? 'नफा मोजा' : 'Calculate Profit', route: `/harvest?crop=${crop}`, icon: 'Calculator' },
        { label: language === 'mr' ? 'वाहतूक बुक करा' : 'Book Transportation', route: `/transport?crop=${crop}`, icon: 'Truck' }
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
