import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  Truck, 
  Calendar, 
  CloudSunRain, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export default function FarmerSummarySection({ crops = [], onAddCropClick }) {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const profile = user?.FarmerProfile;
  const district = profile?.district || 'Pune';

  // Real database-backed active bookings
  const [activeBookings, setActiveBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Real weather status
  const [weatherData, setWeatherData] = useState(null);
  const [weatherError, setWeatherError] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchBookings() {
      if (!isAuthenticated || user?.role !== 'farmer') return;
      try {
        setLoadingBookings(true);
        const token = sessionStorage.getItem('harvestmitra_token') || localStorage.getItem('harvestmitra_token');
        if (!token || token === 'guest') return;

        const res = await fetch(`${API_BASE_URL}/api/transport/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && isMounted) {
          const active = json.data.filter(b => ['pending', 'assigned', 'in_transit', 'accepted'].includes(b.status));
          setActiveBookings(active);
        }
      } catch (err) {
        // Handled silently
      } finally {
        if (isMounted) setLoadingBookings(false);
      }
    }

    async function fetchWeather() {
      try {
        setLoadingWeather(true);
        setWeatherError(false);
        const res = await fetch(`${API_BASE_URL}/api/weather?district=${encodeURIComponent(district)}`);
        const json = await res.json();
        if (json.success && isMounted) {
          setWeatherData(json);
        } else if (isMounted) {
          setWeatherError(true);
        }
      } catch (err) {
        if (isMounted) setWeatherError(true);
      } finally {
        if (isMounted) setLoadingWeather(false);
      }
    }

    fetchBookings();
    fetchWeather();

    return () => { isMounted = false; };
  }, [isAuthenticated, user, district]);

  return (
    <section aria-labelledby="farmer-summary-heading" className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div>
          <h2 id="farmer-summary-heading" className="farmer-section-heading">
            {language === 'mr' ? 'शेती सारांश' : language === 'hi' ? 'खेत सारांश' : 'My Farm Summary'}
          </h2>
          <p className="farmer-subtext mt-0.5">
            Key operational details for your registered crops, active trips, and local weather.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. CROPS LISTED */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="farmer-subtext font-bold text-slate-700">Crops Listed</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {crops.length > 0 ? (
              <div className="space-y-2">
                <p className="farmer-price-value text-slate-900">
                  {crops.length} <span className="text-base font-bold text-slate-600">Crop{crops.length > 1 ? 's' : ''}</span>
                </p>
                <div className="space-y-1.5 pt-1">
                  {crops.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                      <span className="font-semibold text-slate-800">{c.cropName}</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {c.harvestQuantityKg.toLocaleString('en-IN')} kg
                      </span>
                    </div>
                  ))}
                  {crops.length > 3 && (
                    <p className="text-xs text-slate-500 font-medium">+{crops.length - 3} more crop(s)</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-2 text-left space-y-1">
                <p className="farmer-body text-slate-600">No crops listed yet.</p>
                <p className="farmer-subtext text-slate-400">Add your crop to view market rates.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <a
              href="#registered-crops"
              onClick={onAddCropClick}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{crops.length > 0 ? 'Manage Crops' : 'Add First Crop'}</span>
            </a>
          </div>
        </div>

        {/* 2. ACTIVE BOOKINGS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="farmer-subtext font-bold text-slate-700">Active Bookings</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {activeBookings.length > 0 ? (
              <div className="space-y-2">
                <p className="farmer-price-value text-slate-900">
                  {activeBookings.length} <span className="text-base font-bold text-slate-600">Trip{activeBookings.length > 1 ? 's' : ''}</span>
                </p>
                <div className="space-y-1.5 pt-1">
                  {activeBookings.slice(0, 2).map((b, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-950">{b.cropName}</span>
                        <span className="font-semibold text-blue-800 uppercase text-[10px] bg-white px-1.5 py-0.5 rounded border border-blue-200">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate">{b.destinationMarket || 'APMC Yard'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-2 text-left space-y-1">
                <p className="farmer-body text-slate-600">No active bookings.</p>
                <p className="farmer-subtext text-slate-400">All dispatches are completed.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <Link
              to="/transport"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800"
            >
              <span>View Transport</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3. UPCOMING TASKS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="farmer-subtext font-bold text-slate-700">Upcoming Schedule</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Harvest Readiness Cycle</span>
                </div>
                <p className="text-slate-600 font-medium">
                  {crops.length > 0 ? `${crops[0].cropName} ready for APMC dispatch.` : 'Maintain regular field watering.'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Mandi Operating Hours</span>
                </div>
                <p className="text-slate-600 font-medium">Mon - Sat: 06:00 AM - 08:00 PM</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <Link
              to="/harvest"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 hover:text-amber-900"
            >
              <span>Harvest Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4. RELEVANT WEATHER ALERT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="farmer-subtext font-bold text-slate-700">Weather in {district}</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <CloudSunRain className="w-5 h-5 text-teal-600" />
              </div>
            </div>

            {loadingWeather ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Checking local weather...</span>
              </div>
            ) : weatherError ? (
              <div className="py-2 space-y-1">
                <p className="farmer-body text-slate-600">Weather unavailable</p>
                <p className="farmer-subtext text-slate-400">Could not connect to weather feed.</p>
              </div>
            ) : weatherData ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="farmer-price-value text-slate-900">
                    {weatherData.current?.temperature || 28}°C
                  </span>
                  <span className="farmer-subtext text-slate-600">
                    Rain: {weatherData.current?.precipitationProbability || weatherData.current?.rainChance || 15}%
                  </span>
                </div>

                {weatherData.advisory?.level === 'RAIN_ADVISORY' || (weatherData.current?.precipitationProbability > 50) ? (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-900 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Rain warning: Store harvested crop under waterproof cover.</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Favorable harvest & transport window.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <p className="farmer-body text-slate-600">Clear conditions</p>
                <p className="farmer-subtext text-slate-400">Good harvest window.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <Link
              to="/weather"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              <span>Full Weather Forecast</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
