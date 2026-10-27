/**
 * RegisteredCropsManager.jsx
 * Interactive Multi-Crop Management, APMC Market Prices, Quantities & Dynamic Revenue Realization
 * HarvestMitra AI
 */

import React, { useState } from 'react';
import { 
  Sprout, 
  Scale, 
  TrendingUp, 
  Calculator, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  Calendar,
  Building2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) || '';

const POPULAR_CROPS = [
  'Tomato', 'Onion', 'Potato', 'Cotton', 'Wheat',
  'Soybean', 'Rice', 'Maize', 'Pomegranate', 'Grapes',
  'Sugarcane', 'Turmeric', 'Green Chilli', 'Brinjal', 'Garlic',
  'Groundnut', 'Mustard'
];

export default function RegisteredCropsManager({
  crops = [],
  loading = false,
  onRefresh,
  district = 'Pune',
  state = 'Maharashtra'
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [deletingCropName, setDeletingCropName] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add crop form state
  const [newCropName, setNewCropName] = useState('Tomato');
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [customCropName, setCustomCropName] = useState('');
  const [newHarvestQty, setNewHarvestQty] = useState('500');
  const [newHarvestUnit, setNewHarvestUnit] = useState('kg');

  // Edit quantity form state
  const [editHarvestQty, setEditHarvestQty] = useState('');
  const [editHarvestUnit, setEditHarvestUnit] = useState('kg');

  // Open Edit Modal
  function handleOpenEdit(crop) {
    setEditingCrop(crop);
    setEditHarvestQty(String(crop.enteredQuantity || crop.harvestQuantityKg || 500));
    setEditHarvestUnit(crop.unit || 'kg');
  }

  // Submit Add Crop
  async function handleAddCropSubmit(e) {
    e.preventDefault();
    const finalCropName = (isCustomCrop ? customCropName : newCropName).trim();
    if (!finalCropName) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a valid crop name.'
      });
      return;
    }

    const qty = Number(newHarvestQty);
    if (Number.isNaN(qty) || qty <= 0) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Harvest quantity must be a positive number greater than zero.'
      });
      return;
    }

    // Duplicate check client-side
    if (crops.some(c => c.cropName.toLowerCase() === finalCropName.toLowerCase())) {
      showToast({
        type: 'error',
        title: 'Duplicate Crop',
        message: `${finalCropName} is already registered. Please edit the existing crop quantity instead.`
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('harvestmitra_token')) || 
                    (typeof localStorage !== 'undefined' && localStorage.getItem('harvestmitra_token')) || 'guest';
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'guest') {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers['x-guest-mode'] = 'true';
      }

      const res = await fetch(`${API_BASE_URL}/api/farmer/crops`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cropName: finalCropName,
          harvestQuantityKg: qty,
          unit: newHarvestUnit
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to add crop.');
      }

      showToast({
        type: 'success',
        title: '🌾 Crop Registered',
        message: `${finalCropName} (${qty} ${newHarvestUnit}) successfully added to your farm portfolio.`
      });

      setIsAddModalOpen(false);
      setCustomCropName('');
      setIsCustomCrop(false);
      setNewHarvestQty('500');
      if (typeof onRefresh === 'function') onRefresh();

    } catch (err) {
      showToast({
        type: 'error',
        title: 'Registration Error',
        message: err.message
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Submit Edit Crop Quantity
  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingCrop) return;

    const qty = Number(editHarvestQty);
    if (Number.isNaN(qty) || qty <= 0) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Harvest quantity must be a positive number greater than zero.'
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('harvestmitra_token')) || 
                    (typeof localStorage !== 'undefined' && localStorage.getItem('harvestmitra_token')) || 'guest';
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'guest') {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers['x-guest-mode'] = 'true';
      }

      const res = await fetch(`${API_BASE_URL}/api/farmer/crops/${encodeURIComponent(editingCrop.cropName)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          harvestQuantityKg: qty,
          unit: editHarvestUnit
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update crop quantity.');
      }

      showToast({
        type: 'success',
        title: '✅ Quantity Updated',
        message: `Updated ${editingCrop.cropName} harvest quantity to ${qty} ${editHarvestUnit}.`
      });

      setEditingCrop(null);
      if (typeof onRefresh === 'function') onRefresh();

    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Error',
        message: err.message
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Delete Crop
  async function handleConfirmDelete() {
    if (!deletingCropName) return;

    setActionLoading(true);
    try {
      const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('harvestmitra_token')) || 
                    (typeof localStorage !== 'undefined' && localStorage.getItem('harvestmitra_token')) || 'guest';
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'guest') {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers['x-guest-mode'] = 'true';
      }

      const res = await fetch(`${API_BASE_URL}/api/farmer/crops/${encodeURIComponent(deletingCropName)}`, {
        method: 'DELETE',
        headers
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to remove crop.');
      }

      showToast({
        type: 'success',
        title: '🗑️ Crop Removed',
        message: `${deletingCropName} removed from your registered crops.`
      });

      setDeletingCropName(null);
      if (typeof onRefresh === 'function') onRefresh();

    } catch (err) {
      showToast({
        type: 'error',
        title: 'Removal Error',
        message: err.message
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section aria-labelledby="registered-crops-heading" className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sprout className="w-4 h-4" />
            </span>
            <h2 id="registered-crops-heading" className="text-lg sm:text-xl font-bold text-text flex items-center gap-2">
              <span>{t('registeredCrops.title', 'My Registered Crops')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                {crops.length} {crops.length === 1 ? t('registeredCrops.cropCount', 'Crop').replace('{count}', '') : t('registeredCrops.cropsCount', 'Crops').replace('{count}', '')}
              </span>
            </h2>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {t('registeredCrops.subtitle', 'Crop-specific harvest quantities, live APMC Mandi rates & dynamically calculated estimated gross realization')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {typeof onRefresh === 'function' && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={t('registeredCrops.refreshRates', 'Refresh Rates')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('registeredCrops.refreshRates', 'Refresh Rates')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            id="add-crop-action-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('registeredCrops.addCrop', 'Add Crop')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {crops.length === 0 ? (
        // Empty State (STEP 3 Requirement: Show useful empty state when no crops exist)
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300 shadow-2xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Sprout className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">{t('registeredCrops.noCropsTitle', 'No crops registered yet')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('registeredCrops.noCropsDesc', 'Register the commodities you cultivate to unlock dynamic APMC market rates, harvest planning, and projected revenues.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('registeredCrops.registerFirstCrop', 'Register Your First Crop')}</span>
          </button>
        </div>
      ) : (
        // Table & Responsive Grid of Registered Crops (STEP 8 Layout)
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{t('registeredCrops.tableCropName', 'Crop Name')}</th>
                  <th className="py-3 px-4">{t('registeredCrops.tableHarvestQty', 'Harvest Quantity')}</th>
                  <th className="py-3 px-4">{t('registeredCrops.tableLivePrice', 'Live APMC Market Price')}</th>
                  <th className="py-3 px-4">{t('registeredCrops.tableEstimatedRevenue', 'Estimated Gross Revenue')}</th>
                  <th className="py-3 px-4 text-right">{t('registeredCrops.tableActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {crops.map((item) => {
                  const hasPrice = item.marketPricePerKg !== null && item.marketPricePerKg > 0;
                  const formattedRev = item.estimatedRevenue !== null
                    ? `₹${item.estimatedRevenue.toLocaleString('en-IN')}`
                    : t('registeredCrops.revenueUnavailable', 'Revenue unavailable');

                  return (
                    <tr key={item.cropName} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Crop Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                            <Sprout className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-sm font-extrabold text-slate-900 block">
                              {item.cropName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.statusNotice || 'APMC Registered'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Harvest Quantity */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-slate-900">
                              {item.harvestQuantityKg.toLocaleString('en-IN')} kg
                            </span>
                            {item.unit && item.unit !== 'kg' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                                {item.enteredQuantity} {item.unit}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {(item.harvestQuantityKg / 100).toFixed(1)} Quintals
                          </span>
                        </div>
                      </td>

                      {/* 3. Live APMC Market Price */}
                      <td className="py-3.5 px-4">
                        {hasPrice ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-extrabold text-emerald-700">
                                ₹{item.marketPricePerKg.toFixed(2)} / kg
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {item.priceStatus || 'LIVE'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700">{item.marketName || `${district} APMC`}</span>
                              <span>&bull;</span>
                              <span>₹{item.marketPricePerQuintal ? item.marketPricePerQuintal.toLocaleString('en-IN') : Math.round(item.marketPricePerKg * 100)}/Qtl</span>
                              {item.priceDate && (
                                <>
                                  <span>&bull;</span>
                                  <span>{item.priceDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Market price unavailable</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Mandi observation pending for {district}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Estimated Gross Revenue */}
                      <td className="py-3.5 px-4">
                        {item.estimatedRevenue !== null ? (
                          <div className="space-y-0.5">
                            <span className="text-sm font-mono font-black text-blue-700">
                              {formattedRev}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              {item.harvestQuantityKg.toLocaleString('en-IN')} kg &times; ₹{item.marketPricePerKg.toFixed(2)}/kg
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-xs text-slate-400 italic font-semibold">
                              Uncalculated
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Awaiting verified rate
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 5. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                            title={`Edit ${item.cropName} quantity`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCropName(item.cropName)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title={`Remove ${item.cropName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Revenue Formula & Notice Footer */}
          <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span><strong>Formula:</strong> Estimated Gross Revenue = Harvest Quantity (kg) &times; Verified APMC Market Rate (₹/kg)</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Rates verified against Maharashtra APMC Directorates & AGMARKNET. Input/transport costs not deducted.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD CROP MODAL
      ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-800 text-emerald-200">
                  <Sprout className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">{t('registeredCrops.modalAddTitle', 'Add Crop to Farm Portfolio')}</h3>
                  <p className="text-[10px] text-emerald-200">{t('registeredCrops.modalAddSubtitle', 'Register crop & individual harvest quantity')}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-emerald-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCropSubmit} className="p-6 space-y-4">
              {/* Crop Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('registeredCrops.cropCommodity', 'Crop Commodity *')}
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomCrop(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      !isCustomCrop 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Standard Crop
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCustomCrop(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      isCustomCrop 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('registeredCrops.customCropOption', '+ Custom / Other Crop')}
                  </button>
                </div>

                {!isCustomCrop ? (
                  <select
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                  >
                    {POPULAR_CROPS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder={t('registeredCrops.cropNamePlaceholder', 'e.g. Green Chilli, Garlic, Pomegranate')}
                    value={customCropName}
                    onChange={(e) => setCustomCropName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                  />
                )}
              </div>

              {/* Harvest Quantity & Unit */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('registeredCrops.harvestReadyQty', 'Harvest Ready Quantity *')}
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    placeholder="500"
                    value={newHarvestQty}
                    onChange={(e) => setNewHarvestQty(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600"
                  />

                  {/* Unit Selector */}
                  <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setNewHarvestUnit('kg')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        newHarvestUnit === 'kg'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewHarvestUnit('quintal')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        newHarvestUnit === 'quintal' || newHarvestUnit === 'qtl'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      qtl
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewHarvestUnit('tonne')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        newHarvestUnit === 'tonne' || newHarvestUnit === 'ton'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      tonne
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Unit conversions: 1 Quintal = 100 kg &bull; 1 Tonne = 1,000 kg
                </p>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {t('registeredCrops.cancel', 'Cancel')}
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('registeredCrops.savingCrop', 'Saving Crop...')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('registeredCrops.saveCrop', 'Save Crop to Portfolio')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT QUANTITY MODAL
      ======================================================== */}
      {editingCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-slate-800 text-emerald-400">
                  <Scale className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">{t('registeredCrops.modalEditTitle', 'Update Harvest Quantity')}</h3>
                  <p className="text-[10px] text-slate-300">{editingCrop.cropName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingCrop(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('registeredCrops.harvestReadyQty', 'Harvest Ready Quantity *')}
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={editHarvestQty}
                    onChange={(e) => setEditHarvestQty(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-primary"
                  />

                  {/* Unit Selector */}
                  <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setEditHarvestUnit('kg')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        editHarvestUnit === 'kg'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditHarvestUnit('quintal')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        editHarvestUnit === 'quintal' || editHarvestUnit === 'qtl'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      qtl
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditHarvestUnit('tonne')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        editHarvestUnit === 'tonne' || editHarvestUnit === 'ton'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      tonne
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCrop(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {t('registeredCrops.cancel', 'Cancel')}
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('registeredCrops.updatingQty', 'Updating...')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('registeredCrops.updateHarvestQty', 'Update Quantity')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CROP CONFIRMATION MODAL
      ======================================================== */}
      {deletingCropName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">{t('registeredCrops.modalDeleteTitle', 'Confirm Crop Removal')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('registeredCrops.modalDeleteDesc', 'Are you sure you want to remove {cropName} from your registered crops?').replace('{cropName}', deletingCropName)}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCropName(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t('registeredCrops.cancel', 'Cancel')}
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? t('registeredCrops.deletingCrop', 'Removing...') : t('registeredCrops.deleteCrop', 'Remove Crop')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
