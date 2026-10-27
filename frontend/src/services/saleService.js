/**
 * saleService.js
 * Frontend Service for Farmer Sale Records, Realized Proceeds & Profit Reports
 * HarvestMitra AI
 */

import { apiClient } from './apiClient';

export async function fetchSaleRecords(filters = {}) {
  const params = new URLSearchParams();
  if (filters.crop && filters.crop !== 'all') params.append('crop', filters.crop);
  if (filters.market && filters.market !== 'all') params.append('market', filters.market);
  if (filters.paymentStatus && filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await apiClient(`/api/farmer/sales${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch sales');
  return data;
}

export async function createSaleRecord(payload) {
  const res = await apiClient('/api/farmer/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create sale record');
  return data;
}

export async function updateSaleRecord(id, payload) {
  const res = await apiClient(`/api/farmer/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update sale record');
  return data;
}

export async function deleteSaleRecord(id) {
  const res = await apiClient(`/api/farmer/sales/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete sale record');
  return data;
}

export async function fetchProfitSummary() {
  const res = await apiClient('/api/farmer/sales/summary');
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch profit summary');
  return data;
}

export async function seedDemoSales() {
  const res = await apiClient('/api/farmer/sales/seed-demo', {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to seed sample sales');
  return data;
}
