import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Database,
  IndianRupee,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const QUICK_SEARCHES = [
  { crop: 'Tomato', market: 'Pune' },
  { crop: 'Tomato', market: 'Surat' },
  { crop: 'Potato', market: 'Delhi' },
  { crop: 'Onion', market: 'Nashik' },
  { crop: 'Green Chilli', market: 'Bengaluru' },
  { crop: 'Wheat', market: 'Ahmedabad' },
  { crop: 'Cauliflower', market: 'Kolkata' },
];

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'NA';
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

export default function MarketsPage() {
  const [prices, setPrices] = useState([]);
  const [commodity, setCommodity] = useState('');
  const [marketSearch, setMarketSearch] = useState('');
  const [source, setSource] = useState('live');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '60' });
    if (source === 'demo') params.set('source', 'demo');
    if (commodity.trim()) params.set('commodity', commodity.trim());
    if (marketSearch.trim()) params.set('search', marketSearch.trim());
    return params.toString();
  }, [commodity, marketSearch, source]);

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

  function applyQuickSearch(item) {
    setCommodity(item.crop);
    setMarketSearch(item.market);
    setSource('demo');
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-6 px-4">
      <section className="rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              <span>Live Market Rate Finder</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
              Mandi Price Search
            </h1>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Search all-India mandi prices. Live mode calls AGMARKNET/data.gov.in; demo mode covers major markets and vegetables for presentation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-64">
            <div className="rounded-lg bg-primary-50 border border-primary/20 px-4 py-3">
              <p className="text-xs font-semibold text-muted">Records</p>
              <p className="text-2xl font-extrabold text-primary">{prices.length}</p>
            </div>
            <div className="rounded-lg bg-secondary border border-border px-4 py-3">
              <p className="text-xs font-semibold text-muted">Source</p>
              <p className="text-sm font-bold text-text">{source === 'demo' ? 'Demo DB' : 'Live first'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px_auto] gap-4 md:items-end">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Crop name</span>
            <div className="flex items-center rounded-lg border border-border bg-white focus-within:border-primary">
              <Search className="w-4 h-4 text-muted ml-3 shrink-0" />
              <input
                value={commodity}
                onChange={(event) => setCommodity(event.target.value)}
                placeholder="Tomato, potato, onion, chilli"
                className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm outline-none"
              />
            </div>
              <p className="text-xs text-muted">Vegetables supported in demo: Tomato, Onion, Potato, Brinjal, Cabbage, Cauliflower, Green Chilli.</p>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Market or city</span>
            <div className="flex items-center rounded-lg border border-border bg-white focus-within:border-primary">
              <MapPin className="w-4 h-4 text-muted ml-3 shrink-0" />
              <input
                value={marketSearch}
                onChange={(event) => setMarketSearch(event.target.value)}
                placeholder="Pune, Delhi, Bengaluru"
                className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <p className="text-xs text-muted">Leave blank for all markets</p>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Data source</span>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="live">Live first</option>
              <option value="demo">Demo database</option>
            </select>
          </label>

          <button
            type="button"
            onClick={loadMarketPrices}
            disabled={loading}
            className="btn-primary h-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Search</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-muted">
            <Database className="w-4 h-4 text-primary" />
            <span>{message || 'Loading mandi rates...'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((item) => (
              <button
                key={`${item.crop}-${item.market}`}
                type="button"
                onClick={() => applyQuickSearch(item)}
                className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-text hover:border-primary hover:text-primary"
              >
                {item.crop} in {item.market}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-lg border border-error/20 bg-red-50 text-error text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text">Current Mandi Rates</h2>
          <span className="text-xs text-muted">{prices.length} records</span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-white p-8 text-sm text-muted text-center">
            Loading latest market prices...
          </div>
        ) : prices.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-primary">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-text">No matching rate found</p>
              <p className="text-sm text-muted mt-1">
                Click a quick search like Tomato in Pune, or choose Demo database.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="hidden md:grid grid-cols-[1.1fr_1.15fr_0.8fr_0.85fr_0.9fr] gap-3 px-4 py-3 bg-secondary text-xs font-bold text-muted uppercase tracking-wider">
              <span>Crop</span>
              <span>Market</span>
              <span>Modal Rate</span>
              <span>Range</span>
              <span>Date / Source</span>
            </div>

            <div className="divide-y divide-border">
              {prices.map((item, index) => (
                <article
                  key={`${item.crop}-${item.market}-${item.priceDate}-${index}`}
                  className="grid grid-cols-1 md:grid-cols-[1.1fr_1.15fr_0.8fr_0.85fr_0.9fr] gap-3 px-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-bold text-text">{item.crop}</p>
                    <p className="text-xs text-muted">{item.variety || 'Common variety'}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-text">{item.market}</p>
                    <p className="text-xs text-muted">
                      {[item.district, item.state].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  <div>
                    <p className="font-extrabold text-primary flex items-center gap-1">
                      {formatPrice(item.pricePerQuintal)}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </p>
                    <p className="text-xs text-muted">per quintal</p>
                  </div>

                  <div>
                    <p className="font-semibold text-text">{getPriceSpread(item)}</p>
                    <p className="text-xs text-muted">{formatPrice(item.pricePerKg)} / kg</p>
                  </div>

                  <div>
                    <p className="font-semibold text-text">{item.priceDate || 'Today'}</p>
                    <p className="text-xs text-muted">{item.source}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
