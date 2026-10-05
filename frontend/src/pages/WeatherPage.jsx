import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CloudSunRain,
  Droplets,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  Wind,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
const QUICK_LOCATIONS = ['Pune', 'Surat', 'Ahmedabad', 'Nashik', 'Delhi', 'Bengaluru'];

function adviceClasses(tone) {
  if (tone === 'danger') return 'bg-red-50 text-error border-error/20';
  if (tone === 'warning') return 'bg-amber-50 text-warning border-amber-200';
  return 'bg-success/10 text-success border-success/20';
}

export default function WeatherPage() {
  const [location, setLocation] = useState('Pune');
  const [source, setSource] = useState('live');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ location });
    if (source === 'demo') params.set('source', 'demo');
    return params.toString();
  }, [location, source]);

  async function loadWeather() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/forecast?${query}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Weather could not be loaded');
      }
      setForecast(payload);
    } catch (err) {
      setForecast(null);
      setError(err.message || 'Backend is not reachable. Start backend with npm run dev.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, [query]);

  const current = forecast?.current;
  const advice = forecast?.advice;

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-6 px-4">
      <section className="rounded-xl border border-border bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <CloudSunRain className="w-4 h-4" />
              <span>Live Weather & Harvest Timing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
              Harvest Weather Alerts
            </h1>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Check live weather, rain risk, wind, and harvest timing advice using Open-Meteo with demo fallback.
            </p>
          </div>

          <div className="rounded-lg bg-primary-50 border border-primary/20 px-4 py-3 min-w-48">
            <p className="text-xs font-semibold text-muted">Data source</p>
            <p className="text-sm font-bold text-primary">{forecast?.source === 'live' ? 'Open-Meteo Live' : 'Demo forecast'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-4 md:items-end">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">City or village</span>
            <div className="flex items-center rounded-lg border border-border bg-white focus-within:border-primary">
              <MapPin className="w-4 h-4 text-muted ml-3 shrink-0" />
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Pune, Surat, Nashik"
                className="w-full rounded-lg bg-transparent px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Source</span>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="live">Live first</option>
              <option value="demo">Demo forecast</option>
            </select>
          </label>

          <button type="button" onClick={loadWeather} disabled={loading} className="btn-primary h-10">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Check</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_LOCATIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLocation(item)}
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-text hover:border-primary hover:text-primary"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-lg border border-error/20 bg-red-50 text-error text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-white p-8 text-sm text-muted text-center">
          Loading weather forecast...
        </div>
      ) : forecast && current ? (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-amber-50 text-accent flex items-center justify-center border border-amber-200">
                    <CloudSunRain className="w-9 h-9" />
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-text">{Math.round(current.temperature)}°C</p>
                    <p className="text-sm text-muted">
                      {current.condition} • {forecast.location.name}, {forecast.location.state}
                    </p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${adviceClasses(advice.tone)}`}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{advice.status}</span>
                </div>
              </div>

              <p className="text-sm text-muted border-t border-border pt-4">{advice.detail}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-secondary p-4">
                  <Thermometer className="w-4 h-4 text-accent mb-2" />
                  <p className="text-xs text-muted">Temperature</p>
                  <p className="font-extrabold text-text">{Math.round(current.temperature)}°C</p>
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <Droplets className="w-4 h-4 text-blue-500 mb-2" />
                  <p className="text-xs text-muted">Humidity</p>
                  <p className="font-extrabold text-text">{Math.round(current.humidity)}%</p>
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <AlertTriangle className="w-4 h-4 text-warning mb-2" />
                  <p className="text-xs text-muted">Rain risk</p>
                  <p className="font-extrabold text-text">{forecast.rainChance}%</p>
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <Wind className="w-4 h-4 text-teal-500 mb-2" />
                  <p className="text-xs text-muted">Wind</p>
                  <p className="font-extrabold text-text">{Math.round(current.windSpeed)} km/h</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-text mb-4">Harvest Decision</h2>
              <div className={`rounded-lg border p-4 ${adviceClasses(advice.tone)}`}>
                <p className="text-lg font-extrabold">{advice.status}</p>
                <p className="text-sm mt-2">{advice.detail}</p>
              </div>
              <p className="text-xs text-muted mt-4">
                Trigger logic: high rain or heavy precipitation suggests delay; moderate rain/wind suggests caution; low risk suggests safe harvest window.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary border-b border-border">
              <h2 className="text-base font-bold text-text">5-Day Forecast</h2>
            </div>
            <div className="divide-y divide-border">
              {forecast.daily.map((day) => (
                <div key={day.date} className="grid grid-cols-2 md:grid-cols-5 gap-3 px-4 py-4 text-sm">
                  <p className="font-bold text-text">{day.date}</p>
                  <p><span className="text-muted">Rain:</span> {day.rainChance}%</p>
                  <p><span className="text-muted">Precip:</span> {day.precipitation} mm</p>
                  <p><span className="text-muted">Max:</span> {Math.round(day.maxTemp)}°C</p>
                  <p><span className="text-muted">Min:</span> {Math.round(day.minTemp)}°C</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
