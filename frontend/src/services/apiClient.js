/**
 * apiClient.js
 * Authenticated API Client Helper for HarvestMitra AI
 * Wraps fetch, automatically injects Authorization header, and handles 401 logout/redirect.
 */

import { API_BASE_URL } from '../config/apiConfig';
const TOKEN_KEY = 'harvestmitra_token';
const USER_KEY = 'harvestmitra_user';

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(TOKEN_KEY)) ||
                (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('token')) ||
                (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) ||
                (typeof localStorage !== 'undefined' && localStorage.getItem('token'));
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('harvestmitra_admin_token');
      sessionStorage.clear();
    } catch (_) {}

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }

  return response;
}

export default apiClient;
