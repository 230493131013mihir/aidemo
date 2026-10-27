/**
 * chatService.js
 * Client-side integration for HarvestMitra AI Chat API
 * HarvestMitra AI - ISSUE-10
 */

import { API_BASE_URL } from '../config/apiConfig';

/**
 * Generate or retrieve persistent anonymous session ID
 * @returns {string}
 */
export function getOrCreateSessionId() {
  const STORAGE_KEY = 'mitra_chat_session_id';
  try {
    let sessionId = localStorage.getItem(STORAGE_KEY);
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch (_) {
    return 'session_' + Date.now();
  }
}

/**
 * Send user message to Mitra Assistant Backend API
 *
 * @param {Object} payload
 * @param {string} payload.message - User prompt
 * @param {string} payload.language - 'en' | 'hi' | 'gu' | 'mr'
 * @param {string} [payload.sessionId] - Session ID
 * @param {Object} [payload.context] - Structured crop or market context
 * @param {Array} [payload.conversationHistory] - Previous chat turns
 * @returns {Promise<Object>} API response payload
 */
export async function sendChatMessage({
  message,
  language = 'en',
  sessionId = null,
  context = {},
  conversationHistory = []
}) {
  const currentSessionId = sessionId || getOrCreateSessionId();

  const body = {
    message,
    language,
    session_id: currentSessionId,
    context,
    conversationHistory
  };

  const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('harvestmitra_token')) ||
                (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('token')) ||
                (typeof localStorage !== 'undefined' && localStorage.getItem('harvestmitra_token')) ||
                (typeof localStorage !== 'undefined' && localStorage.getItem('token'));
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['x-guest-mode'] = 'true';
    headers['Authorization'] = 'Bearer guest';
  }

  // 1. Try primary endpoint via proxy or configured API_BASE_URL
  const primaryUrl = `${API_BASE_URL}/api/chat/message`;
  try {
    let response = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    // If 401 (e.g. stale or expired token), auto-retry once with guest credentials
    if (response.status === 401 && token) {
      headers['x-guest-mode'] = 'true';
      headers['Authorization'] = 'Bearer guest';
      response = await fetch(primaryUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Server responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      provider: data.provider || 'gemini',
      mode: data.mode || 'ai',
      message: data.message || data.reply || '',
      metadata: data.metadata || {},
      source_disclaimer: data.source_disclaimer || ''
    };
  } catch (error) {
    // 2. If relative URL failed (Vite proxy disconnect or network drop), retry directly on 127.0.0.1:5000
    if (!API_BASE_URL || API_BASE_URL === '') {
      try {
        const directUrl = 'http://127.0.0.1:5000/api/chat/message';
        let directResponse = await fetch(directUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (directResponse.status === 401) {
          headers['x-guest-mode'] = 'true';
          headers['Authorization'] = 'Bearer guest';
          directResponse = await fetch(directUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
          });
        }

        if (directResponse.ok) {
          const data = await directResponse.json();
          return {
            success: true,
            provider: data.provider || 'gemini',
            mode: data.mode || 'ai',
            message: data.message || data.reply || '',
            metadata: data.metadata || {},
            source_disclaimer: data.source_disclaimer || ''
          };
        }
      } catch (_) {}
    }

    console.error('[ChatService Error]:', error.message);
    throw error;
  }
}

/**
 * Query AI provider health and configuration status
 * @returns {Promise<Object>}
 */
export async function getChatStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/status`);
    if (!response.ok) {
      throw new Error(`Status check failed with HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('[ChatService Status Check Warning]:', error.message);
    return {
      status: 'offline',
      service: 'Mitra Assistant AI Service',
      isProviderConfigured: false,
      fallbackReady: true,
      supportedLanguages: ['en', 'hi', 'gu', 'mr']
    };
  }
}
