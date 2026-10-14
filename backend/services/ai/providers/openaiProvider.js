/**
 * openaiProvider.js
 * OpenAI Provider for Mitra Assistant
 * HarvestMitra AI - ISSUE-09
 */

class OpenAIProvider {
  constructor(config = {}) {
    this.name = 'openai';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || null;
    this.model = config.model || process.env.AI_MODEL || 'gpt-4o-mini';
    this.timeoutMs = Number(config.timeoutMs || process.env.AI_TIMEOUT_MS || 15000);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  /**
   * Check if provider has valid credentials
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.apiKey && typeof this.apiKey === 'string' && this.apiKey.trim().length > 0);
  }

  /**
   * Format history and prompt for OpenAI Chat Completions API
   */
  _formatMessages(systemPrompt, userMessage, history = []) {
    const messages = [];

    // System instruction
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: String(systemPrompt)
      });
    }

    // Conversation history
    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item || !item.content) continue;
        const role = item.role === 'assistant' ? 'assistant' : 'user';
        messages.push({
          role,
          content: String(item.content)
        });
      }
    }

    // Current user message
    messages.push({
      role: 'user',
      content: String(userMessage)
    });

    return messages;
  }

  /**
   * Generate AI response using OpenAI Chat Completions API
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
      const err = new Error('OpenAI API credentials not configured');
      err.code = 'NO_CREDENTIALS';
      throw err;
    }

    const { systemPrompt, userMessage, history = [], language = 'en', intent = 'unknown' } = payload;

    const endpoint = `${this.baseUrl}/chat/completions`;

    const requestBody = {
      model: this.model,
      messages: this._formatMessages(systemPrompt, userMessage, history),
      temperature: 0.2,
      max_tokens: 800
    };

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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

        const sanitizedMsg = `OpenAI API error (Status ${response.status}): ${errorDetails}`;
        const err = new Error(sanitizedMsg);
        err.statusCode = response.status;
        throw err;
      }

      const data = await response.json();

      const messageContent = data?.choices?.[0]?.message?.content;

      if (!messageContent || typeof messageContent !== 'string' || messageContent.trim().length === 0) {
        const err = new Error('OpenAI API returned an empty or malformed message response');
        err.code = 'EMPTY_RESPONSE';
        throw err;
      }

      return {
        success: true,
        provider: 'openai',
        mode: 'ai',
        message: messageContent.trim(),
        metadata: {
          model: this.model,
          intent,
          language
        }
      };
    } catch (err) {
      clearTimeout(timeoutTimer);

      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`OpenAI API request timed out after ${this.timeoutMs}ms`);
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }

      throw err;
    }
  }
}

module.exports = OpenAIProvider;
