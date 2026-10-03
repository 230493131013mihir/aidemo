/**
 * weatherApiService.js
 * Frontend API client for Weather & District Rain Advisories
 * HarvestMitra AI - ISSUE-11
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';

export async function fetchWeather(district = 'Surat', state = 'Gujarat') {
  const query = new URLSearchParams({ district, state });
  const url = `${API_BASE_URL}/api/weather?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load weather: HTTP ${res.status}`);
  return await res.json();
}

export async function fetchRainAlerts(district = 'Surat', state = 'Gujarat') {
  const query = new URLSearchParams({ district, state });
  const url = `${API_BASE_URL}/api/weather/alerts?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load rain alerts: HTTP ${res.status}`);
  return await res.json();
}
