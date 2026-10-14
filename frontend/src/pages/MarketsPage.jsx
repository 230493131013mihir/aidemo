import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Database,
  IndianRupee,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  Sparkles,
  Store,
  Tag,
  Compass,
  ShieldCheck,
  Layers,
  Clock,
  Truck,
  ArrowUpDown,
  Calculator
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 'NA';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(number);
}

function getPriceSpread(item) {
  const min = Number(item.minPrice);
  const max = Number(item.maxPrice);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 'Range NA';
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

const QUICK_CROPS = [
  'Tomato',
  'Potato',
  'Onion',
  'Wheat',
  'Green Chilli',
  'Rice',
  'Cotton',
  'Groundnut',
  'Mustard',
  'Soybean',
  'Garlic',
  'Cumin'
];

const REGION_TABS = [
  { id: '', label: 'All India', count: '65 Mandis' },
  { id: 'Gujarat', label: 'Gujarat', count: '12 Mandis' },
  { id: 'Maharashtra', label: 'Maharashtra', count: '9 Mandis' },
  { id: 'North India', label: 'North India', count: '13 Mandis' },
  { id: 'Madhya Pradesh', label: 'Madhya Pradesh', count: '6 Mandis' },
  { id: 'South India', label: 'South India', count: '13 Mandis' },
  { id: 'East & North-East', label: 'East & NE', count: '12 Mandis' },
];

export default function MarketsPage() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [commodity, setCommodity] = useState('Tomato');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [marketSearch, setMarketSearch] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'priceDesc', 'priceAsc', 'name'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' });
    if (commodity.trim()) params.set('commodity', commodity.trim());
    if (selectedRegion.trim()) params.set('state', selectedRegion.trim());
    if (marketSearch.trim()) params.set('market', marketSearch.trim());
    return params.toString();
  }, [commodity, selectedRegion, marketSearch]);

  async function loadMarketPrices() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/market/prices?${query}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Market rates could not be loaded');
      }
      setPrices(payload.data || []);
      setMessage(payload.message || '');
    } catch (err) {
      setPrices([]);
      setError(err.message || 'Backend is not reachable. Start backend with npm run dev.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarketPrices();
  }, [query]);

  // Robust Client-Side Deduplication & Sorting
  const displayPrices = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const item of prices) {
      const marketKey = (item.market || '').toLowerCase().trim();
      if (!marketKey || seen.has(marketKey)) continue;
      seen.add(marketKey);
      result.push(item);
    }

    if (sortBy === 'priceDesc') {
      return result.sort((a, b) => (b.modalPrice || 0) - (a.modalPrice || 0));
    }
    if (sortBy === 'priceAsc') {
      return result.sort((a, b) => (a.modalPrice || 0) - (b.modalPrice || 0));
    }
    if (sortBy === 'name') {
      return result.sort((a, b) => (a.market || '').localeCompare(b.market || ''));
    }
    // Default: distance nearest first
    return result.sort((a, b) => (a.distanceFromSuratKm || 0) - (b.distanceFromSuratKm || 0));
  }, [prices, sortBy]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* 1. Cinematic Photographic Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/mandi-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-emerald-950/75 backdrop-blur-[1px]" />
        
        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pan-India APMC Network • Verified Live Rates</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              All-India Mandi Rates & Live Arrivals
            </h1>

            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm max-w-xl">
              Reliable wholesale APMC mandi price discovery covering Gujarat, Maharashtra, Delhi NCR, Punjab, Haryana, Rajasthan, MP, Karnataka, Tamil Nadu, and across India without duplication.
            </p>

            {/* Quick Crop Filter Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-400" /> Crop:
              </span>
              <button
                type="button"
                onClick={() => setCommodity('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  commodity.toLowerCase() === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                }`}
              >
                All Crops
              </button>
              {QUICK_CROPS.map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => setCommodity(crop)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    commodity.toLowerCase() === crop.toLowerCase()
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 min-w-[260px] shrink-0">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Mandis Reporting</span>
              <p className="text-3xl font-black text-white font-mono mt-0.5">{displayPrices.length}</p>
              <span className="text-[10px] text-emerald-300 font-semibold">Zero Duplicates</span>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Network Coverage</span>
              <p className="text-sm font-black text-emerald-300 mt-2 flex items-center justify-center gap-1">
                <Compass className="w-4 h-4 text-emerald-400" /> All-India APMC
              </p>
              <span className="text-[10px] text-slate-300 font-medium">65 Key Hubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Region / Zone Tabs */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {REGION_TABS.map((tab) => {
          const isActive = selectedRegion === tab.id;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setSelectedRegion(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white text-slate-700 border-border hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </section>

      {/* 3. Search & Filter Bar */}
      <section className="rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_auto] gap-4 lg:items-end">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Crop Commodity</span>
            <div className="flex items-center rounded-xl border border-border bg-white px-3 focus-within:border-primary">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                value={commodity}
                onChange={(event) => setCommodity(event.target.value)}
                placeholder="e.g. Tomato, Potato, Onion, Wheat"
                className="w-full rounded-xl bg-transparent px-2.5 py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">APMC Mandi / City / State</span>
            <div className="flex items-center rounded-xl border border-border bg-white px-3 focus-within:border-primary">
              <MapPin className="w-4 h-4 text-muted shrink-0" />
              <input
                value={marketSearch}
                onChange={(event) => setMarketSearch(event.target.value)}
                placeholder="e.g. Surat, Lasalgaon, Azadpur, Kolar"
                className="w-full rounded-xl bg-transparent px-2.5 py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Sort Mandis By</span>
            <div className="flex items-center rounded-xl border border-border bg-white px-3 focus-within:border-primary">
              <ArrowUpDown className="w-4 h-4 text-muted shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl bg-transparent px-2 py-2.5 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="distance">Nearest to Hub</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="name">Market Name (A-Z)</option>
              </select>
            </div>
          </label>

          <button
            type="button"
            onClick={loadMarketPrices}
            disabled={loading}
            className="btn-primary h-11 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Search Mandis</span>
          </button>
        </div>

        {message && (
          <div className="text-xs text-muted flex items-center gap-1.5 pt-1">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
      </section>

      {/* 4. Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-start gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* 5. Price Cards Grid */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span>Market Rates ({displayPrices.length} distinct mandis reporting)</span>
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Unique Mandis
            </span>
            <span>•</span>
            <span>Modal Rate (per quintal / kg)</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-muted rounded-3xl bg-white border border-border flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="font-semibold">Loading real-time All-India APMC price data...</p>
          </div>
        ) : displayPrices.length === 0 ? (
          <div className="p-16 text-center text-sm text-muted rounded-3xl bg-white border border-border space-y-2">
            <p className="font-bold text-slate-700 text-base">No price records found for this filter.</p>
            <p className="text-xs text-slate-500">Try searching for Tomato, Potato, Onion, Wheat, or select "All India".</p>
            <button
              type="button"
              onClick={() => { setCommodity('Tomato'); setSelectedRegion(''); setMarketSearch(''); }}
              className="mt-2 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPrices.map((item, index) => {
              const modalQuintal = item.modalPrice || item.pricePerQuintal || 0;
              const modalKg = item.pricePerKg
                ? Number(item.pricePerKg).toFixed(1)
                : modalQuintal
                ? (Number(modalQuintal) / 100).toFixed(1)
                : null;
              const cropName = item.commodity || item.crop || 'Agricultural Produce';
              const distanceKm = Number(item.distanceFromSuratKm || 0);

              return (
                <article
                  key={`${item.market}-${cropName}-${index}`}
                  className="rounded-3xl border border-border bg-white p-5 shadow-xs hover:border-primary/50 hover:shadow-lg transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Header: Market Name + State Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h3 className="font-extrabold text-base text-slate-900 tracking-tight leading-snug">
                          {item.market || 'APMC Mandi'}
                        </h3>
                        <p className="text-xs text-muted font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.district ? `${item.district}, ` : ''}{item.state || 'India'}</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                          {cropName}
                        </span>
                        {item.operatingDays && (
                          <span className="text-[10px] text-slate-600 font-semibold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-500" /> {item.operatingDays}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rate Box */}
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/80 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Modal Mandi Rate</p>
                        <p className="text-xl font-black text-primary font-mono mt-0.5">
                          {formatPrice(modalQuintal)} <span className="text-xs text-muted font-normal">/ Qtl</span>
                        </p>
                      </div>

                      {modalKg && (
                        <div className="text-right">
                          <span className="inline-block text-xs text-emerald-900 font-black bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg font-mono">
                            ₹{modalKg} / kg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer details: Daily Range & Hub Distance */}
                  <div className="space-y-2 pt-1 border-t border-border/60 text-xs">
                    <div className="flex items-center justify-between text-muted">
                      <span>Daily Spread:</span>
                      <span className="font-mono font-bold text-slate-800">{getPriceSpread(item)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-700">
                      <span>Hub Logistics:</span>
                      <span className="font-medium text-slate-700">
                        {distanceKm === 0 ? 'Local Hub (0 km)' : `${distanceKm} km from Hub`}
                      </span>
                    </div>

                    {/* 1-Click Connected Actions */}
                    <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => navigate('/harvest')}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1"
                      >
                        <Calculator className="w-3 h-3 text-slate-600" />
                        <span>Simulate Profit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/transport')}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-primary hover:bg-primary-dark text-white transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Pool Freight</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
