const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('harvestmitra_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function fetchSchemes(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.state && params.state !== 'all') query.set('state', params.state);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);

  const res = await fetch(`${API_BASE_URL}/api/schemes?${query.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch government schemes.');
  }
  return json;
}

export async function fetchSchemeById(idOrSlug) {
  const res = await fetch(`${API_BASE_URL}/api/schemes/${idOrSlug}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch scheme details.');
  }
  return json.data;
}

export async function matchFarmerSchemes(farmerAnswers) {
  const res = await fetch(`${API_BASE_URL}/api/schemes/match`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(farmerAnswers)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to calculate scheme eligibility.');
  }
  return json.data;
}

export async function fetchSavedSchemes() {
  const res = await fetch(`${API_BASE_URL}/api/schemes/saved`, {
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load saved schemes.');
  }
  return json.data;
}

export async function saveScheme(schemeId, notes = '') {
  const res = await fetch(`${API_BASE_URL}/api/schemes/saved`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ schemeId, notes })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to save scheme.');
  }
  return json;
}

export async function removeSavedScheme(schemeId) {
  const res = await fetch(`${API_BASE_URL}/api/schemes/saved/${schemeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to remove saved scheme.');
  }
  return json;
}

export async function fetchChecklistProgress(schemeId) {
  const res = await fetch(`${API_BASE_URL}/api/schemes/${schemeId}/checklist`, {
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    return { checkedDocumentIds: [] };
  }
  return json.data;
}

export async function updateChecklistProgress(schemeId, checkedDocumentIds) {
  const res = await fetch(`${API_BASE_URL}/api/schemes/${schemeId}/checklist`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ checkedDocumentIds })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to save checklist progress.');
  }
  return json.data;
}
