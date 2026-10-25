import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Search, 
  Layers, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Scale
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

export default function FpoCropAvailabilityPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected lots for aggregation staging
  const [selectedLotKeys, setSelectedLotKeys] = useState(new Set());

  async function loadLots() {
    setLoading(true);
    try {
      const res = await apiClient(`/api/fpo/crop-availability?crop=${selectedCrop}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLots(json.data);
      }
    } catch (err) {
      console.error('Failed to load crop availability:', err);
      showToast({ type: 'error', title: 'Network Error', message: 'Unable to load member crop lots.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLots();
  }, [selectedCrop]);

  const uniqueCrops = useMemo(() => {
    const s = new Set();
    lots.forEach(l => { if (l.cropName) s.add(l.cropName); });
    return Array.from(s).sort();
  }, [lots]);

  const filteredLots = useMemo(() => {
    return lots.filter(l => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        l.farmerName.toLowerCase().includes(q) ||
        l.cropName.toLowerCase().includes(q) ||
        l.village.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q)
      );
    });
  }, [lots, searchQuery]);

  function toggleLot(lot) {
    const key = `${lot.farmerId}_${lot.cropName}`;
    const next = new Set(selectedLotKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedLotKeys(next);
  }

  function proceedToAggregation() {
    if (selectedLotKeys.size === 0) {
      showToast({ type: 'warning', title: 'No Lots Selected', message: 'Please select at least one crop lot to pool into an aggregation.' });
      return;
    }

    const selectedLots = lots.filter(l => selectedLotKeys.has(`${l.farmerId}_${l.cropName}`));
    // Pass staged lots via session storage
    sessionStorage.setItem('staged_aggregation_lots', JSON.stringify(selectedLots));
    navigate('/fpo/aggregation');
  }

  const totalAvailableKg = useMemo(() => {
    return filteredLots.reduce((acc, curr) => acc + (curr.availableQuantityKg || 0), 0);
  }, [filteredLots]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4" />
            <span>Member Produce Inventory</span>
          </div>
          <h1 className="text-2xl font-black text-text">Crop Availability & Staging</h1>
          <p className="text-xs text-muted mt-0.5">
            Audit uncommitted harvest volumes across verified members. Select compatible lots to form bulk collective consignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadLots}
            className="p-2.5 rounded-xl border border-border hover:bg-slate-50 text-muted hover:text-text transition-colors"
            title="Refresh Lots"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={proceedToAggregation}
            disabled={selectedLotKeys.size === 0}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Layers className="w-4 h-4" />
            <span>Pool Selected Lots ({selectedLotKeys.size})</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-border shadow-xs">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Uncommitted Produce</span>
          <p className="text-2xl font-black text-text mt-1">
            {totalAvailableKg >= 1000 ? `${(totalAvailableKg / 1000).toFixed(1)} MT` : `${totalAvailableKg} kg`}
          </p>
          <span className="text-[11px] text-teal-700 font-semibold">{filteredLots.length} Crop lots ready for sale</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-xs">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Distinct Crops in Network</span>
          <p className="text-2xl font-black text-text mt-1">{uniqueCrops.length}</p>
          <span className="text-[11px] text-muted font-medium">{uniqueCrops.slice(0, 4).join(', ') || 'Produce'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-xs">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Selected for Aggregation</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{selectedLotKeys.size} Lots</p>
          <span className="text-[11px] text-purple-700 font-medium">Ready to bundle into collective lot</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search crop, farmer, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">Filter Crop:</span>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="rounded-xl border border-border px-3 py-2 text-xs bg-white text-text font-semibold outline-none focus:border-primary"
          >
            <option value="all">All Crops ({lots.length})</option>
            {uniqueCrops.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Crop Lots Table */}
      <section className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-border text-[11px] uppercase tracking-wider text-muted font-bold">
              <tr>
                <th className="px-5 py-3.5 w-10">Select</th>
                <th className="px-5 py-3.5">Produce Crop</th>
                <th className="px-5 py-3.5">Member Producer</th>
                <th className="px-5 py-3.5">Pickup Location</th>
                <th className="px-5 py-3.5">Total Harvest</th>
                <th className="px-5 py-3.5">Committed in Deals</th>
                <th className="px-5 py-3.5">Available for New Orders</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-muted">
                    {loading ? 'Evaluating member crop inventories...' : 'No crop availability found.'}
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => {
                  const key = `${lot.farmerId}_${lot.cropName}`;
                  const isSelected = selectedLotKeys.has(key);
                  return (
                    <tr key={key} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-purple-50/40' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={lot.availableQuantityKg <= 0}
                          onChange={() => toggleLot(lot)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-text text-sm">{lot.cropName}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-text flex items-center gap-1">
                          <span>{lot.farmerName}</span>
                          {lot.isGovtVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {lot.village}, {lot.district}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">
                        {lot.totalHarvestKg} kg
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-amber-700">
                        {lot.committedKg > 0 ? `${lot.committedKg} kg` : '0 kg'}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-xs text-emerald-700">
                        {lot.availableQuantityKg} kg
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={lot.availableQuantityKg <= 0}
                          onClick={() => toggleLot(lot)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {isSelected ? '✓ Selected' : '+ Stage'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
