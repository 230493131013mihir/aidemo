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

    // 2. Language Determination
    const resolvedLang = normalizeLanguage(
      userProvidedLang || detectLanguage(cleanMessage, req.user?.preferred_language || 'en')
    );

    // 3. Intent Detection
    const detectedIntent = detectIntent(cleanMessage);

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

    // Auto-enrich market data if query asks about price or harvest decision
    let marketData = callerContext.marketData;
    // Override callerContext.marketData if user explicitly asked about a specific crop or location
    const shouldRefreshMarket = !marketData || extractedCrop || extractedLocation;
    if (shouldRefreshMarket && (detectedIntent === 'market_price' || detectedIntent === 'harvest_decision') && cropMention) {
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
        name: req.user?.full_name || callerContext.farmer?.name || 'Farmer',
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

module.exports = {
  handleChatMessage,
  handleChatStatus
};
