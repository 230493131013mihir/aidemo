/**
 * transportApiService.js
 * Client API service for Shared Transport & Vehicle Pooling
 * HarvestMitra AI - ISSUE-08
 */

const API_BASE = '/api/transport';

/**
 * Fetch all available transport vehicles
 */
export async function fetchVehicles(params = {}) {
  const query = new URLSearchParams();
  if (params.destination) query.append('destination', params.destination);
  if (params.location) query.append('location', params.location);

  const res = await fetch(`${API_BASE}/vehicles?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transport vehicles');
  return res.json();
}

/**
 * Match transport vehicles by route, date, and crop quantity
 */
export async function matchTransport(requestPayload) {
  const res = await fetch(`${API_BASE}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });
  if (!res.ok) throw new Error('Failed to match transport');
  return res.json();
}

/**
 * Confirm a shared pool booking
 */
export async function bookTransportPool(bookingPayload) {
  const res = await fetch(`${API_BASE}/pool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload)
  });
  if (!res.ok) throw new Error('Failed to book transport space');
  return res.json();
}
