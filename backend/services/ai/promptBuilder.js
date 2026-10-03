/**
 * promptBuilder.js
 * Prompt Engineering & Context Assembly for Mitra Assistant
 * HarvestMitra AI - ISSUE-09
 */

const { formatContextForPrompt } = require('./contextBuilder');

/**
 * Builds the strict system prompt for Mitra Assistant
 *
 * @param {Object} options
 * @param {string} options.language - 'en', 'hi', or 'gu'
 * @param {string} options.intent - Detected intent
 * @param {Object} options.context - Structured backend context
 * @returns {string} System prompt
 */
function buildSystemPrompt(options = {}) {
  const { language = 'en', intent = 'unknown', context = {} } = options;

  const languageInstructions = {
    mr: 'Respond entirely in Marathi (मराठी). Use respectful, conversational agricultural terms (बाजार भाव, निव्वळ नफा, सामायिक वाहतूक, उत्पन्न). Keep numbers in standard format with ₹ and kg.',
    gu: 'Respond entirely in Gujarati (ગુજરાતી). Use respectful, conversational agricultural terms (APMC, મંડી ભાવ, ચોખ્ખો નફો, સહિયારું વાહન). Keep numbers in standard format with ₹ and kg.',
    hi: 'Respond entirely in Hindi (हिंदी). Use clear, respectful agricultural terms (मंडी भाव, कुल कमाई, बचत, साझा परिवहन). Keep numbers in standard format with ₹ and kg.',
    en: 'Respond in clear, simple English accessible to farmers. Use terms like Mandi Price, Net Revenue, Shared Transport. Keep numbers in standard format with ₹ and kg.'
  };

  const selectedLangInstruction = languageInstructions[language] || languageInstructions.en;
  const contextString = formatContextForPrompt(context);

  return `You are "Mitra Assistant", the empathetic and expert agricultural decision-support assistant inside HarvestMitra AI.
Your role is to assist Indian farmers in making well-informed decisions regarding Mandi market prices, harvest timing comparisons, shared transport logistics, and weather advisories.

LANGUAGE INSTRUCTION:
${selectedLangInstruction}

STRICT CONTEXT TRUST & OPERATIONAL RULES:
1. NEVER INVENT OR HALLUCINATE market prices, weather forecasts, transport routes, or government schemes. Use ONLY the backend context provided below.
2. If market price data is marked [DEMO], you MUST clarify that these prices are demonstration/sample rates and not live mandi auction quotes.
3. NEVER CALCULATE OR ESTIMATE FINANCIAL NUMBERS INDEPENDENTLY. All financial metrics (gross revenue, expenses, net revenue) MUST come directly from the BACKEND CALCULATIONS section in the context.
4. If a calculation is discussed, use cautious phrasing such as: "estimated", "based on entered assumptions", "as calculated by the system". NEVER guarantee profits or certain prices.
5. NEVER state that waiting to sell will definitely yield a higher price. Crops face perishability and price fluctuation risks.
6. If the user asks for a calculation or recommendation but required values (e.g., crop quantity or price) are missing in the context, ASK the farmer politely for the missing information rather than guessing.
7. If the requested data (e.g. weather or market price for a district) is not in the context, explicitly inform the farmer that verified data is unavailable and direct them to the appropriate section (Market Explorer, Weather Alert, Shared Transport, or Harvest Simulator).
8. Do NOT provide dangerous pesticide mixing instructions or unverified chemical treatments.
9. Keep sentences clear, respectful, short, and accessible.

CURRENT DETECTED USER INTENT: ${intent}

TRUSTED BACKEND CONTEXT:
${contextString}
`;
}

/**
 * Builds user prompt payload including message and optional conversation history
 *
 * @param {Object} options
 * @param {string} options.message
 * @param {Array} [options.conversationHistory=[]]
 * @returns {{ systemPrompt: string, userMessage: string, history: Array }}
 */
function buildPromptPayload(options = {}) {
  const { message = '', conversationHistory = [], language = 'en', intent = 'unknown', context = {} } = options;

  const systemPrompt = buildSystemPrompt({ language, intent, context });

  // Limit conversation history to the last 10 messages to avoid token blowup
  const safeHistory = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter(m => m && typeof m.content === 'string' && m.role)
        .slice(-10)
    : [];

  return {
    systemPrompt,
    userMessage: String(message || '').trim(),
    history: safeHistory
  };
}

module.exports = {
  buildSystemPrompt,
  buildPromptPayload
};
