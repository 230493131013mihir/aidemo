/**
 * marketApiService.js
 * Frontend API client for Mandi market prices and comparisons
 * HarvestMitra AI - ISSUE-11
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';

export async function fetchMarkets(params = {}) {
  const query = new URLSearchParams();
  if (params.district) query.set('district', params.district);
  if (params.state) query.set('state', params.state);

  const url = `${API_BASE_URL}/api/markets${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load markets: HTTP ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchCrops() {
  const url = `${API_BASE_URL}/api/markets/crops`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load crops: HTTP ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchMarketPrices(params = {}) {
  const query = new URLSearchParams();
  if (params.crop) query.set('crop', params.crop);
  if (params.market) query.set('market', params.market);
  if (params.district) query.set('district', params.district);
  if (params.state) query.set('state', params.state);
  if (params.data_type) query.set('data_type', params.data_type);

  const url = `${API_BASE_URL}/api/markets/prices${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load market prices: HTTP ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchPriceTrends(crop = 'Tomato', market = 'Surat APMC Mandi', days = 7) {
  const query = new URLSearchParams({ crop, market, days: String(days) });
  const url = `${API_BASE_URL}/api/markets/prices/trends?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load price trends: HTTP ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

export async function compareMarkets(crop = 'Tomato', marketIds = []) {
  const query = new URLSearchParams({ crop });
  if (marketIds.length > 0) {
    query.set('marketIds', marketIds.join(','));
  }
  const url = `${API_BASE_URL}/api/markets/compare?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to compare markets: HTTP ${res.status}`);
  const data = await res.json();
  return data.data || null;
}
