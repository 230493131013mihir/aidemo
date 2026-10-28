import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  X, 
  Scale, 
  MapPin, 
  ShieldCheck, 
  Calendar,
  Store,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

export default function FpoAggregationPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [aggregations, setAggregations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aggregation Creation Builder Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableLots, setAvailableLots] = useState([]);
  const [builderCrop, setBuilderCrop] = useState('Tomato');
  const [builderVariety, setBuilderVariety] = useState('Hybrid Vaishali');
  const [builderGrade, setBuilderGrade] = useState('Grade A');
  const [expectedRate, setExpectedRate] = useState('28');
  const [pickupDistrict, setPickupDistrict] = useState('Pune');
  const [pickupHub, setPickupHub] = useState('Haveli FPO Aggregation Centre');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // [{ farmerId, farmerName, availableKg, committedQuantityKg }]
  const [submitting, setSubmitting] = useState(false);

  // Selected Aggregation for Details Modal
  const [selectedAgg, setSelectedAgg] = useState(null);

  async function loadAggregations() {
    setLoading(true);
    try {
      const res = await apiClient('/api/fpo/aggregations');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAggregations(json.data);
      }
    } catch (err) {
      console.error('Failed to load aggregations:', err);
      showToast({ type: 'error', title: 'Network Error', message: 'Unable to load aggregations.' });
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableLots(crop = 'Tomato') {
    try {
      const res = await apiClient(`/api/fpo/crop-availability?crop=${encodeURIComponent(crop)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailableLots(json.data.filter(l => l.availableQuantityKg > 0));
      }
    } catch (err) {
      console.error('Failed to load lots for builder:', err);
    }
  }

  useEffect(() => {
    loadAggregations();

    // Check if user came from Crop Availability page with staged lots
    const stagedStr = sessionStorage.getItem('staged_aggregation_lots');
    if (stagedStr) {
      try {
        const staged = JSON.parse(stagedStr);
        if (Array.isArray(staged) && staged.length > 0) {
          const firstCrop = staged[0].cropName;
          setBuilderCrop(firstCrop);
          setSelectedItems(staged.map(s => ({
            farmerId: s.farmerId,
            farmerName: s.farmerName,
            availableKg: s.availableQuantityKg,
            committedQuantityKg: String(s.availableQuantityKg)
          })));
          setIsModalOpen(true);
        }
      } catch (e) {}
      sessionStorage.removeItem('staged_aggregation_lots');
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      loadAvailableLots(builderCrop);
    }
  }, [isModalOpen, builderCrop]);

  function addItemToBuilder(lot) {
    if (selectedItems.some(i => i.farmerId === lot.farmerId)) return;
    setSelectedItems(prev => [
      ...prev,
      {
        farmerId: lot.farmerId,
        farmerName: lot.farmerName,
        availableKg: lot.availableQuantityKg,
        committedQuantityKg: String(lot.availableQuantityKg)
      }
    ]);
  }

  function removeItemFromBuilder(farmerId) {
    setSelectedItems(prev => prev.filter(i => i.farmerId !== farmerId));
  }

  function updateItemQuantity(farmerId, qty) {
    setSelectedItems(prev => prev.map(i => {
      if (i.farmerId === farmerId) {
        return { ...i, committedQuantityKg: qty };
      }
      return i;
    }));
  }

  const builderTotalKg = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + (Number(curr.committedQuantityKg) || 0), 0);
  }, [selectedItems]);

  async function handleCreateAggregation(e) {
    e.preventDefault();
    if (selectedItems.length === 0) {
      showToast({ type: 'warning', title: 'Lots Required', message: 'Add at least one member farmer lot.' });
      return;
    }

    // Validate quantities
    for (const item of selectedItems) {
      const q = Number(item.committedQuantityKg);
      if (isNaN(q) || q <= 0) {
        showToast({ type: 'error', title: 'Invalid Quantity', message: `Please enter a valid quantity for ${item.farmerName}.` });
        return;
      }
      if (q > item.availableKg) {
        showToast({ type: 'error', title: 'Over-Allocation', message: `${item.farmerName} only has ${item.availableKg} kg available.` });
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        cropName: builderCrop,
        variety: builderVariety,
        grade: builderGrade,
        expectedRatePerKg: expectedRate,
        pickupDistrict,
        pickupHub,
        notes,
        items: selectedItems.map(i => ({
          farmerId: i.farmerId,
          committedQuantityKg: Number(i.committedQuantityKg)
        }))
      };

      const res = await apiClient('/api/fpo/aggregations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Creation failed');
      }

      showToast({
        type: 'success',
        title: 'Aggregation Created',
        message: json.message
      });
      setIsModalOpen(false);
      setSelectedItems([]);
      await loadAggregations();
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelAggregation(id) {
    if (!window.confirm('Cancel this aggregation? Committed produce will be unlocked for farmers.')) return;
    try {
      const res = await apiClient(`/api/fpo/aggregations/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      showToast({ type: 'info', title: 'Aggregation Cancelled', message: json.message });
      await loadAggregations();
    } catch (err) {
      showToast({ type: 'error', title: 'Cancel Failed', message: err.message });
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1720px] mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Collective Pooling Engine</span>
          </div>
          <h1 className="text-2xl font-black text-text">Crop Aggregation Workspace</h1>
          <p className="text-xs text-muted mt-0.5">
            Assemble multi-farmer lots into standardized bulk consignments for competitive APMC mandi bidding.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadAggregations}
            className="p-2.5 rounded-xl border border-border hover:bg-slate-50 text-muted hover:text-text transition-colors"
            title="Refresh Aggregations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Aggregation</span>
          </button>
        </div>
      </div>

      {/* Aggregations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aggregations.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-border p-12 text-center text-muted space-y-3">
            <Layers className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-text">No Aggregation Lots Built Yet</h3>
            <p className="text-xs max-w-md mx-auto">
              Pool member farmers' harvests together to meet bulk buyer minimum order requirements and unlock premium pricing.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Aggregation</span>
            </button>
          </div>
        ) : (
          aggregations.map((agg) => (
            <div key={agg.id} className="bg-white rounded-3xl border border-border p-5 shadow-xs space-y-4 hover:border-purple-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold uppercase tracking-wider">
                      {agg.aggregationCode}
                    </span>
                    <h3 className="text-base font-black text-text mt-1">{agg.cropName}</h3>
                    <p className="text-xs text-muted">{agg.variety || 'Standard Variety'} • {agg.grade}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    agg.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    agg.status === 'offered' ? 'bg-amber-100 text-amber-800' :
                    agg.status === 'ready' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {agg.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted">Total Bulk Weight</span>
                    <p className="font-bold text-text font-mono text-sm">{agg.totalQuantityKg} kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted">Expected Benchmark</span>
                    <p className="font-bold text-emerald-700 text-sm">₹{agg.expectedRatePerKg || '25'}/kg</p>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-muted">Pickup Hub</span>
                    <p className="font-semibold text-text truncate">{agg.pickupHub}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted">
                    <span>Participating Farmers</span>
                    <span className="text-purple-700 font-bold">{agg.Items?.length || 0} Members</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(agg.Items || []).slice(0, 3).map(item => (
                      <span key={item.id} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-border text-slate-700">
                        {item.Farmer?.name || `Farmer #${item.farmerId}`}: <strong className="font-mono">{item.committedQuantityKg}kg</strong>
                      </span>
                    ))}
                    {(agg.Items || []).length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 text-muted">+{agg.Items.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgg(agg)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View Details
                </button>

                <div className="flex items-center gap-1.5">
                  {agg.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => navigate('/fpo/procurement')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Offer to Mandi</span>
                    </button>
                  )}
                  {['draft', 'ready'].includes(agg.status) && (
                    <button
                      type="button"
                      onClick={() => handleCancelAggregation(agg.id)}
                      className="p-1.5 rounded-xl text-red-500 hover:bg-red-50"
                      title="Cancel Aggregation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AGGREGATION BUILDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-border my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-text">Assemble Collective Crop Lot</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAggregation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Target Crop *</label>
                  <select
                    value={builderCrop}
                    onChange={(e) => {
                      setBuilderCrop(e.target.value);
                      setSelectedItems([]);
                    }}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs bg-white outline-none focus:border-primary"
                  >
                    <option value="Tomato">Tomato (टोमॅटो)</option>
                    <option value="Onion">Onion (कांदा)</option>
                    <option value="Wheat">Wheat (गहू)</option>
                    <option value="Soybean">Soybean (सोयाबीन)</option>
                    <option value="Cotton">Cotton (कापूस)</option>
                    <option value="Potato">Potato (बटाटा)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">Variety</label>
                  <input
                    type="text"
                    placeholder="e.g. Hybrid Vaishali"
                    value={builderVariety}
                    onChange={(e) => setBuilderVariety(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">Grade</label>
                  <select
                    value={builderGrade}
                    onChange={(e) => setBuilderGrade(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs bg-white outline-none focus:border-primary"
                  >
                    <option value="Grade A">Grade A (Premium / Export)</option>
                    <option value="Grade B">Grade B (Standard APMC)</option>
                    <option value="Grade C">Grade C (Processing / Sauce)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Expected Rate (₹/kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={expectedRate}
                    onChange={(e) => setExpectedRate(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold text-emerald-700 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">Pickup District *</label>
                  <input
                    type="text"
                    required
                    value={pickupDistrict}
                    onChange={(e) => setPickupDistrict(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">Pickup Hub Centre *</label>
                  <input
                    type="text"
                    required
                    value={pickupHub}
                    onChange={(e) => setPickupHub(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Selected Farmers Lot Staging Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    Participating Member Lots ({selectedItems.length})
                  </span>
                  <span className="text-xs font-black text-purple-700 font-mono">
                    Combined Lot Size: {builderTotalKg} kg
                  </span>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-border bg-slate-50 text-center text-xs text-muted">
                    No lots added yet. Select available farmer lots below.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-border rounded-2xl p-2 bg-slate-50">
                    {selectedItems.map((item) => (
                      <div key={item.farmerId} className="flex items-center justify-between p-2 rounded-xl bg-white border border-border text-xs">
                        <div>
                          <span className="font-bold text-text">{item.farmerName}</span>
                          <span className="text-[11px] text-muted ml-2 font-mono">Available: {item.availableKg}kg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={item.availableKg}
                            value={item.committedQuantityKg}
                            onChange={(e) => updateItemQuantity(item.farmerId, e.target.value)}
                            className="w-24 px-2 py-1 rounded-lg border border-border font-mono font-bold text-right text-xs"
                          />
                          <span className="text-xs font-semibold text-muted">kg</span>
                          <button
                            type="button"
                            onClick={() => removeItemFromBuilder(item.farmerId)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Member Farmers for This Crop */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Available {builderCrop} from Active Members
                </span>
                <div className="max-h-36 overflow-y-auto divide-y divide-border/60 border border-border rounded-2xl">
                  {availableLots.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted">No uncommitted {builderCrop} lots available from active members.</div>
                  ) : (
                    availableLots.map((l) => {
                      const alreadyAdded = selectedItems.some(i => i.farmerId === l.farmerId);
                      return (
                        <div key={l.farmerId} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                          <div>
                            <span className="font-semibold text-text">{l.farmerName}</span>
                            <span className="text-[11px] text-muted ml-2">
                              {l.village} • <strong className="text-emerald-700 font-mono">{l.availableQuantityKg} kg</strong> available
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => addItemToBuilder(l)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              alreadyAdded ? 'bg-slate-100 text-slate-400' : 'bg-purple-50 text-purple-700 border border-purple-300 hover:bg-purple-100'
                            }`}
                          >
                            {alreadyAdded ? 'Added' : '+ Add Lot'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Internal Aggregation Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Harvested on 24 Oct, moisture content 12%, packaged in standard 50kg bags."
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedItems.length === 0}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Assembling...' : `Confirm Aggregation (${builderTotalKg} kg)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AGGREGATION DETAILS MODAL */}
      {selectedAgg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold uppercase">
                  {selectedAgg.aggregationCode}
                </span>
                <h3 className="text-base font-bold text-text mt-1">{selectedAgg.cropName} Collective Consignment</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgg(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-muted">Total Weight:</span>
                <p className="font-bold text-text text-sm">{selectedAgg.totalQuantityKg} kg</p>
              </div>
              <div>
                <span className="text-muted">Benchmark Rate:</span>
                <p className="font-bold text-emerald-700 text-sm">₹{selectedAgg.expectedRatePerKg}/kg</p>
              </div>
              <div>
                <span className="text-muted">Variety & Grade:</span>
                <p className="font-semibold text-text">{selectedAgg.variety || 'Standard'} • {selectedAgg.grade}</p>
              </div>
              <div>
                <span className="text-muted">Aggregation Status:</span>
                <p className="font-bold text-purple-700 uppercase text-xs">{selectedAgg.status}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-2">
                Participating Farmer Lots ({selectedAgg.Items?.length || 0})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border rounded-2xl p-2">
                {(selectedAgg.Items || []).map((item) => (
                  <div key={item.id} className="p-2 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-text">{item.Farmer?.name || `Farmer #${item.farmerId}`}</span>
                      <span className="text-[11px] text-muted ml-2">{item.Farmer?.FarmerProfile?.village || 'Haveli'}</span>
                    </div>
                    <span className="font-mono font-bold text-text">{item.committedQuantityKg} kg</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAgg(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
