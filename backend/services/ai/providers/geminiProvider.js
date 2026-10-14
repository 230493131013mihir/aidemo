/**
 * geminiProvider.js
 * Google Gemini Provider for Mitra Assistant
 * HarvestMitra AI - ISSUE-09
 */

class GeminiProvider {
  constructor(config = {}) {
    this.name = 'gemini';
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || null;
    this.model = config.model || process.env.AI_MODEL || 'gemini-1.5-flash';
    this.timeoutMs = Number(config.timeoutMs || process.env.AI_TIMEOUT_MS || 15000);
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Check if provider has valid credentials
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey && typeof this.apiKey === 'string' && this.apiKey.trim().length > 0);
  }

  /**
   * Format history and prompt for Gemini generateContent API
   */
  _formatContents(userMessage, history = []) {
    const contents = [];

    // Map conversation history
    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item || !item.content) continue;
        const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: String(item.content) }]
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: String(userMessage) }]
    });

    return contents;
  }

  /**
   * Generate AI response using Gemini API
   *
   * @param {Object} payload
   * @param {string} payload.systemPrompt
   * @param {string} payload.userMessage
   * @param {Array} [payload.history]
   * @param {string} [payload.language]
   * @param {string} [payload.intent]
   * @returns {Promise<Object>} Normalized AI response
   */
  async generateResponse(payload = {}) {
    if (!this.isConfigured()) {
      const err = new Error('Gemini API credentials not configured');
      err.code = 'NO_CREDENTIALS';
      throw err;
    }

    const { systemPrompt, userMessage, history = [], language = 'en', intent = 'unknown' } = payload;

    const endpoint = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: this._formatContents(userMessage, history),
      generationConfig: {
        temperature: 0.2, // Low temperature for high factual adherence to backend context
        maxOutputTokens: 800
      }
    };

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorJson = await response.json();
          errorDetails = errorJson?.error?.message || response.statusText;
        } catch (_) {
          errorDetails = response.statusText;
        }

        const sanitizedMsg = `Gemini API error (Status ${response.status}): ${errorDetails}`;
        const err = new Error(sanitizedMsg);
        err.statusCode = response.status;
        throw err;
      }

      const data = await response.json();

      // Extract generated text safely
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        const err = new Error('Gemini API returned an empty or malformed candidate response');
        err.code = 'EMPTY_RESPONSE';
        throw err;
      }

      return {
        success: true,
        provider: 'gemini',
        mode: 'ai',
        message: text.trim(),
        metadata: {
          model: this.model,
          intent,
          language
        }
      };
    } catch (err) {
      clearTimeout(timeoutTimer);

      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Gemini API request timed out after ${this.timeoutMs}ms`);
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }

      throw err;
    }
  }
}

module.exports = GeminiProvider;
