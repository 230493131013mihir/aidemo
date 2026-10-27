/**
 * apiConfig.js
 * Centralized API Base URL Configuration for HarvestMitra AI
 * 
 * Dynamically resolves the API base URL:
 * - Uses build-time VITE_API_BASE_URL or VITE_API_URL if defined
 * - On browser environments hosted on cloud domains (e.g. *.onrender.com, custom domain):
 *   automatically routes to the deployed production backend (https://harvestmitra-backend.onrender.com)
 *   preventing the live site from ever attempting to hit localhost:5000 / 127.0.0.1:5000.
 * - On local development (localhost / 127.0.0.1): defaults to local backend at http://127.0.0.1:5000
 */

export function getApiBaseUrl() {
  // 1. Explicit environment variable takes precedence
  if (typeof import.meta !== 'undefined') {
    const envUrl = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, '');
    }
  }

  // 2. Safe browser environment detection
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local');

    if (!isLocalhost) {
      // Production live cloud deployment (Render, AWS, etc.)
      return 'https://harvestmitra-backend.onrender.com';
    }
  }

  // 3. Localhost development fallback
  return 'http://127.0.0.1:5000';
}

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
