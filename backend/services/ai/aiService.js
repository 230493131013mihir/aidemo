/**
 * aiService.js
 * Provider-Independent AI Service Layer for Mitra Assistant
 * HarvestMitra AI - ISSUE-09
 */

const GeminiProvider = require('./providers/geminiProvider');
const OpenAIProvider = require('./providers/openaiProvider');
const fallbackEngine = require('./fallbackEngine');
const { buildPromptPayload } = require('./promptBuilder');
const { buildContext } = require('./contextBuilder');
const { detectIntent, detectLanguage, normalizeLanguage } = require('./intentDetector');

class AIService {
  constructor() {
    this.providers = new Map();

    // Register built-in providers
    this.registerProvider('gemini', new GeminiProvider());
    this.registerProvider('openai', new OpenAIProvider());
  }

  /**
   * Register a new LLM provider
   * @param {string} name
   * @param {Object} providerInstance - Must implement generateResponse(payload) and isConfigured()
   */
  registerProvider(name, providerInstance) {
    if (!name || !providerInstance) {
      throw new Error('Provider name and instance are required');
    }
    this.providers.set(name.toLowerCase(), providerInstance);
  }

  /**
   * Get configured provider name from environment
   * @returns {string}
   */
  getConfiguredProviderName() {
    const envProvider = (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
    return envProvider;
  }

  /**
   * Safe server-side logger that never outputs secrets or tokens
   */
  _logSafe(event, details = {}) {
    const timestamp = new Date().toISOString();
    const safeDetails = { ...details };

    // Strip sensitive keys if accidentally present
    delete safeDetails.apiKey;
    delete safeDetails.password;
    delete safeDetails.token;
    delete safeDetails.authorization;

    console.warn(`[AI Service ${timestamp}] ${event}:`, JSON.stringify(safeDetails));
  }

  /**
   * Central method to generate a response from Mitra Assistant
   *
   * @param {Object} params
   * @param {string} params.message - Farmer's input message
   * @param {Object} [params.context] - Trusted backend context data
   * @param {Array} [params.conversationHistory] - Previous chat messages
   * @param {string} [params.language] - 'en' | 'hi' | 'gu'
   * @param {string} [params.intent] - Detected or overridden intent
   * @returns {Promise<Object>} Normalized assistant response
   */
  async generateResponse(params = {}) {
    const rawMessage = typeof params.message === 'string' ? params.message.trim() : '';

    // 1. Language determination: explicit param -> script detection -> farmer profile -> 'en'
    const farmerPrefLang = params.context?.farmer?.preferredLanguage || params.context?.farmer?.preferred_language;
    const detectedLang = params.language
      ? normalizeLanguage(params.language)
      : detectLanguage(rawMessage, farmerPrefLang || 'en');

    // 2. Intent determination
    const intent = params.intent || detectIntent(rawMessage);

    // 3. Build verified context using contextBuilder (and mathEngine if applicable)
    const structuredContext = buildContext(params.context || {});

    // Handle empty message safely
    if (!rawMessage) {
      return fallbackEngine.generateResponse({
        intent: 'help',
        language: detectedLang,
        context: structuredContext,
        userMessage: ''
      });
    }

    const providerName = this.getConfiguredProviderName();

    // 4. If configured as 'fallback', execute deterministic engine directly
    if (providerName === 'fallback') {
      return fallbackEngine.generateResponse({
        intent,
        language: detectedLang,
        context: structuredContext,
        userMessage: rawMessage
      });
    }

    // 5. Check if provider is recognized
    const provider = this.providers.get(providerName);

    if (!provider) {
      this._logSafe('Unknown AI provider configured, falling back to rule engine', {
        provider: providerName,
        reason: 'UNSUPPORTED_PROVIDER',
        fallback: true
      });

      return fallbackEngine.generateResponse({
        intent,
        language: detectedLang,
        context: structuredContext,
        userMessage: rawMessage
      });
    }

    // 6. Check if provider has API credentials
    if (!provider.isConfigured()) {
      this._logSafe('AI provider missing credentials, falling back to rule engine', {
        provider: providerName,
        reason: 'NO_CREDENTIALS',
        fallback: true
      });

      return fallbackEngine.generateResponse({
        intent,
        language: detectedLang,
        context: structuredContext,
        userMessage: rawMessage
      });
    }

    // 7. Assemble strict prompt payload
    const promptPayload = buildPromptPayload({
      message: rawMessage,
      conversationHistory: params.conversationHistory,
      language: detectedLang,
      intent,
      context: structuredContext
    });

    // 8. Attempt AI call with automatic fallback on failure
    try {
      const response = await provider.generateResponse({
        ...promptPayload,
        language: detectedLang,
        intent
      });

      return response;
    } catch (err) {
      this._logSafe('AI provider request failed, executing fallback engine', {
        provider: providerName,
        reason: err.code || err.name || 'UNKNOWN_ERROR',
        message: err.message,
        fallback: true
      });

      // Seamless deterministic fallback
      const fallbackResponse = fallbackEngine.generateResponse({
        intent,
        language: detectedLang,
        context: structuredContext,
        userMessage: rawMessage
      });

      // Retain notice of fallback mode while maintaining successful response
      fallbackResponse.fallbackReason = err.code || 'PROVIDER_ERROR';
      return fallbackResponse;
    }
  }
}

// Export singleton instance
const aiService = new AIService();

module.exports = aiService;
module.exports.AIService = AIService;
