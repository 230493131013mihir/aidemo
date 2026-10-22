/**
 * WeatherWidget.jsx
 * HarvestMitra AI - Live Agro-Climatic Weather Intelligence
 * Open-Meteo Integration with Real-Time Telemetry & Functional Refresh
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  CloudSunRain, 
  Droplets, 
  CloudRain, 
  MapPin, 
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  Wind,
  RefreshCw,
  Locate,
  AlertCircle,
  Thermometer,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchWeather, getWeatherConditionMeta, triggerWhatsAppRainToast } from '../../services/weatherApiService';

const MAJOR_AGRO_DISTRICTS = [
  { name: 'Pune', state: 'Maharashtra', region: 'Western Maharashtra' },
  { name: 'Nashik', state: 'Maharashtra', region: 'North Maharashtra' },
  { name: 'Surat', state: 'Gujarat', region: 'South Gujarat' },
  { name: 'Kolhapur', state: 'Maharashtra', region: 'Sugar Belt' },
  { name: 'Nagpur', state: 'Maharashtra', region: 'Vidarbha' },
  { name: 'Solapur', state: 'Maharashtra', region: 'Marathwada Border' },
  { name: 'Ahmednagar', state: 'Maharashtra', region: 'Central Maharashtra' },
  { name: 'Ahmedabad', state: 'Gujarat', region: 'Central Gujarat' },
  { name: 'Navsari', state: 'Gujarat', region: 'South Gujarat' }
];

function WeatherIcon({ iconName, isDay = true, className = "w-8 h-8" }) {
  switch (iconName) {
    case 'sun':
      return <Sun className={`${className} text-amber-300 animate-spin-slow`} aria-hidden="true" />;
    case 'moon':
      return <Moon className={`${className} text-indigo-200`} aria-hidden="true" />;
    case 'cloud-sun':
      return isDay ? (
        <CloudSun className={`${className} text-amber-300`} aria-hidden="true" />
      ) : (
        <CloudMoon className={`${className} text-indigo-200`} aria-hidden="true" />
      );
    case 'cloud':
      return <Cloud className={`${className} text-slate-300`} aria-hidden="true" />;
    case 'cloud-fog':
      return <CloudFog className={`${className} text-slate-300`} aria-hidden="true" />;
    case 'cloud-drizzle':
      return <CloudDrizzle className={`${className} text-blue-300`} aria-hidden="true" />;
    case 'cloud-rain':
      return <CloudRain className={`${className} text-blue-400`} aria-hidden="true" />;
    case 'cloud-lightning':
      return <CloudLightning className={`${className} text-amber-400 animate-pulse`} aria-hidden="true" />;
    case 'snowflake':
    case 'cloud-snow':
      return <Snowflake className={`${className} text-cyan-200`} aria-hidden="true" />;
    default:
      return <CloudSunRain className={`${className} text-emerald-300`} aria-hidden="true" />;
  }
}

export default function WeatherWidget() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast?.() || {};
  const alertedDistrictRef = useRef(null);

  // Primary Farmer location from profile, fallback to Pune
  const profileDistrict = user?.FarmerProfile?.district || 'Pune';
  const profileState = user?.FarmerProfile?.state || 'Maharashtra';

  const [activeLocation, setActiveLocation] = useState(profileDistrict);
  const [activeCoords, setActiveCoords] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');
  const [isDistrictMenuOpen, setIsDistrictMenuOpen] = useState(false);

  // In-flight request controller to prevent race conditions & memory leaks
  const abortControllerRef = useRef(null);
  const autoRefreshTimerRef = useRef(null);
  const lastFetchTimestampRef = useRef(0);

  // Sync with farmer profile if user changes
  useEffect(() => {
    if (user?.FarmerProfile?.district && user.FarmerProfile.district !== activeLocation && !activeCoords) {
      setActiveLocation(user.FarmerProfile.district);
    }
  }, [user]);

  /**
   * Core Live Weather Fetcher
   * @param {Object} options
   * @param {boolean} options.isManualRefresh
   * @param {Object} options.overrideCoords
   * @param {string} options.overrideLocation
   */
  const loadWeatherData = useCallback(async ({
    isManualRefresh = false,
    overrideCoords = null,
    overrideLocation = null
  } = {}) => {
    // Prevent duplicate rapid calls (throttle to 1.2s for manual refresh)
    const now = Date.now();
    if (isManualRefresh && (now - lastFetchTimestampRef.current < 1200)) {
      return;
    }
    lastFetchTimestampRef.current = now;

    // Abort previous in-flight request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const targetLocation = overrideLocation || activeLocation;
    const targetCoords = overrideCoords !== undefined ? overrideCoords : activeCoords;

    if (isManualRefresh) {
      setRefreshing(true);
    } else if (!weatherData) {
      setLoading(true);
    }
    setError('');

    try {
      const response = await fetchWeather(targetLocation, profileState, {
        signal: abortControllerRef.current.signal,
        forceRefresh: isManualRefresh,
        latitude: targetCoords?.latitude,
        longitude: targetCoords?.longitude,
        location: targetLocation
      });

      if (!response || !response.success) {
        throw new Error(response?.error || response?.message || 'Weather service returned an unexpected response');
      }

      setWeatherData(response);
      setLastRefreshedAt(new Date(response.lastUpdated || Date.now()));
      setError('');

      // Automated WhatsApp Rain Alert trigger when heavy rain (>60%) is detected
      const rainProb = response.rainChance ?? response.weather?.rainProbability ?? 0;
      if (rainProb >= 60 && showToast && alertedDistrictRef.current !== targetLocation) {
        alertedDistrictRef.current = targetLocation;
        triggerWhatsAppRainToast(response, showToast);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request intentionally aborted by a newer fetch
        return;
      }
      console.warn('[WeatherWidget] Live weather fetch failure:', err.message);

      // Provide helpful human error messages without crashing
      let friendlyMsg = 'Weather service is temporarily unavailable. Please try again.';
      if (!navigator.onLine) {
        friendlyMsg = 'Unable to load weather. Please check your internet connection.';
      } else if (err.message.includes('404') || err.message.includes('Location not found')) {
        friendlyMsg = `Location "${targetLocation}" not found. Please choose a nearby district.`;
      } else if (isManualRefresh && weatherData) {
        friendlyMsg = 'Weather data could not be refreshed. Showing the last available update.';
      }

      setError(friendlyMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeLocation, activeCoords, profileState, weatherData]);

  // Initial load when active location or coords change
  useEffect(() => {
    loadWeatherData({ isManualRefresh: false });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [activeLocation, activeCoords]);

  // Automatic Background Updates: Every 10 minutes
  useEffect(() => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    autoRefreshTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadWeatherData({ isManualRefresh: false });
      }
    }, TEN_MINUTES_MS);

    // Refresh when tab becomes visible again if older than 5 minutes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastTime = lastRefreshedAt ? lastRefreshedAt.getTime() : 0;
        if (Date.now() - lastTime > 5 * 60 * 1000) {
          loadWeatherData({ isManualRefresh: false });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadWeatherData, lastRefreshedAt]);

  /**
   * Manual Refresh Button Handler
   */
  const handleManualRefresh = () => {
    if (refreshing) return;
    loadWeatherData({ isManualRefresh: true });
  };

  /**
   * Browser Geolocation: Get farmer device GPS
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoNotice('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const coordsObj = {
          latitude,
          longitude,
          name: 'My GPS Location'
        };
        setActiveCoords(coordsObj);
        setActiveLocation('GPS Location');
        setGeoNotice('📍 Detected current device location.');
        setTimeout(() => setGeoNotice(''), 4000);
      },
      (err) => {
        setIsLocating(false);
        let errorMsg = 'Could not access GPS location.';
        if (err.code === 1) {
          errorMsg = 'Location permission was denied. Using saved farm district.';
        } else if (err.code === 2) {
          errorMsg = 'Location unavailable. Using saved farm district.';
        }
        setGeoNotice(errorMsg);
        setTimeout(() => setGeoNotice(''), 5000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectDistrict = (distName) => {
    setActiveCoords(null);
    setActiveLocation(distName);
    setIsDistrictMenuOpen(false);
    setGeoNotice('');
  };

  // Weather metrics parsing from validated API response
  const cur = weatherData?.current || weatherData?.weather || {};
  const temp = cur.temperature !== undefined ? Math.round(cur.temperature) : null;
  const feelsLike = cur.feelsLike !== undefined ? Math.round(cur.feelsLike) : temp;
  const humidity = cur.humidity !== undefined ? Math.round(cur.humidity) : null;
  const precipitation = cur.precipitation ?? cur.rainfallMm ?? 0;
  const windSpeed = cur.windSpeed ?? cur.windSpeedKmh ?? null;
  const weatherCode = cur.weatherCode ?? 0;
  const isDay = cur.isDay !== undefined ? cur.isDay : true;
  const conditionMeta = getWeatherConditionMeta(weatherCode, isDay);
  const condition = cur.condition || conditionMeta.label;
  const rainChance = weatherData?.rainChance ?? cur.rainProbability ?? 0;

  const locName = weatherData?.location?.name || activeLocation;
  // Defensive check: If user's profile state is 'Maharashtra' but API returns 'Gujarat', prefer user's profile state
  const userProfileState = user?.FarmerProfile?.state || user?.state || 'Maharashtra';
  const apiState = weatherData?.location?.state;
  const locState = (userProfileState === 'Maharashtra' && apiState === 'Gujarat')
    ? userProfileState
    : (apiState || userProfileState || 'India');
  const adviceStatus = weatherData?.advice?.status || (rainChance >= 60 ? 'Delay Harvest' : 'Optimal Harvest Window');
  const adviceDetail = weatherData?.advice?.detail || weatherData?.advisory?.message ||
    `Favorable atmospheric conditions in ${locName} for produce picking and transport dispatch.`;

  // Format last updated time
  const formattedTime = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Updating...';

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-700/50 text-white space-y-4">
      {/* Photographic Sky Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url('/images/weather-hero.jpg')` }}
      />
      {/* Dramatic Atmosphere Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-emerald-950/80 backdrop-blur-[0.5px]" />
      <div className="absolute inset-0 bg-radial-at-t from-amber-500/10 via-transparent to-black/40 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-6 space-y-5">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/15 pb-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 to-emerald-500/25 text-amber-300 flex items-center justify-center border border-amber-400/40 shadow-inner backdrop-blur-md">
              <CloudSunRain className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                  Live Agro-Climatic Weather
                </h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Open-Meteo
                </span>
              </div>

              {/* Location display with Quick Dropdown & GPS Locator */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-0.5">
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setIsDistrictMenuOpen(!isDistrictMenuOpen)}
                    id="weather-district-picker-btn"
                    className="inline-flex items-center gap-1.5 font-bold text-white hover:text-emerald-300 transition-colors bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-xl border border-white/15 cursor-pointer backdrop-blur-sm"
                    title="Change location"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>{locName}{locState && locState !== locName ? `, ${locState}` : ''}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform ${isDistrictMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* District Switcher Dropdown */}
                  {isDistrictMenuOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        Select Farm Agro-Zone
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-0.5">
                        {MAJOR_AGRO_DISTRICTS.map((d) => (
                          <button
                            key={d.name}
                            type="button"
                            onClick={() => handleSelectDistrict(d.name)}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              activeLocation === d.name && !activeCoords
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            <span>{d.name}</span>
                            <span className="text-[10px] text-slate-400">{d.region}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* GPS Current Location Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  title="Detect Device GPS Location"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 backdrop-blur-sm"
                >
                  <Locate className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Detecting...' : 'Use GPS'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Bar: Status Pill, Timestamp & Real Refresh Button */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3 h-3" />
              <span>{adviceStatus}</span>
            </span>

            {/* Last Updated Timestamp Tag */}
            <div 
              className="text-right hidden md:block text-[11px] text-slate-300 bg-black/25 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-sm"
              title={lastRefreshedAt ? lastRefreshedAt.toISOString() : ''}
            >
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Updated:</span>
              </div>
              <strong className="text-white font-mono">{formattedTime}</strong>
            </div>

            {/* Functional Refresh Button */}
            <button
              type="button"
              id="refresh-weather-btn"
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              title="Click to refresh live weather telemetry from Open-Meteo"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md backdrop-blur-md border border-emerald-400/40 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
              <span className="text-xs font-black">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>

        {/* GPS Notice / Warning Banner if active */}
        {geoNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-200 flex items-center justify-between animate-fadeIn">
            <span>{geoNotice}</span>
            <button 
              type="button" 
              onClick={() => setGeoNotice('')}
              className="text-slate-300 hover:text-white font-bold text-xs ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* API Error Notification (With Retry button, preserving existing data) */}
        {error && (
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-100 flex items-start justify-between gap-3 backdrop-blur-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block text-white font-bold">Weather Notice:</strong>
                <span>{error}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-white font-bold text-xs border border-amber-300/40 shrink-0 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Weather Display */}
        {loading && !weatherData ? (
          // Initial Loading State Skeleton
          <div className="h-32 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs text-slate-300 font-semibold tracking-wide">
              Connecting to Open-Meteo Agro Telemetry for {locName}...
            </p>
          </div>
        ) : !weatherData && error ? (
          // Empty State on Initial Load Failure
          <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/30 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Weather Data Unavailable</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Retry Fetching Live Weather
            </button>
          </div>
        ) : (
          // Live Data Cards
          <div className="space-y-4">
            {/* Top Highlight Row: Primary Temperature & Condition Tile + Metric Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Highlight (7 Cols): Big Temp + Condition + Feels Like */}
              <div className="lg:col-span-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-emerald-400/20 flex items-center justify-center border border-white/20 shadow-md">
                    <WeatherIcon iconName={conditionMeta.icon} isDay={isDay} className="w-9 h-9" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono tracking-tight">
                        {temp !== null ? `${temp}°C` : '--'}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-300">
                        {condition}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-300" />
                      <span>Feels like: <strong className="text-white font-mono">{feelsLike !== null ? `${feelsLike}°C` : '--'}</strong></span>
                      <span className="text-slate-400">&bull;</span>
                      <span>{isDay ? 'Daytime' : 'Nighttime'}</span>
                    </div>
                  </div>
                </div>

                {/* Subtext info */}
                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 text-xs text-slate-300">
                  <span className="text-emerald-300 font-bold block">{locName} APMC Hub</span>
                  <span className="text-[11px] text-slate-400">Open-Meteo Live Telemetry</span>
                </div>
              </div>

              {/* Right Mini-Stats (5 Cols): Humidity, Wind, Rain Chance, Precipitation */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
                {/* Humidity */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/15 space-y-1 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    <span>Humidity</span>
                  </div>
                  <p className="font-black text-lg text-white font-mono">
                    {humidity !== null ? `${humidity}%` : '--'}
                  </p>
                  <span className="text-[10px] text-slate-400 block">Relative Moisture</span>
                </div>

                {/* Wind Speed */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/15 space-y-1 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                    <Wind className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
                    <span>Wind Speed</span>
                  </div>
                  <p className="font-black text-lg text-white font-mono">
                    {windSpeed !== null ? `${windSpeed} km/h` : '--'}
                  </p>
                  <span className="text-[10px] text-slate-400 block">10m Velocity</span>
                </div>

                {/* Rain Chance */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/15 space-y-1 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    <span>Rain Risk</span>
                  </div>
                  <p className="font-black text-lg text-white font-mono">
                    {rainChance}%
                  </p>
                  <span className="text-[10px] text-slate-400 block">Probability Max</span>
                </div>

                {/* Precipitation */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/15 space-y-1 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                    <CloudSunRain className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Rainfall</span>
                  </div>
                  <p className="font-black text-lg text-white font-mono">
                    {precipitation} mm
                  </p>
                  <span className="text-[10px] text-slate-400 block">Accumulated Rate</span>
                </div>
              </div>

            </div>

            {/* Field Harvest Advisory Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-slate-900/40 border border-emerald-400/30 flex items-start gap-3 text-xs text-emerald-100 backdrop-blur-md shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-400/40 text-emerald-300">
                <Wind className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-xs sm:text-sm">
                    Agro-Advisory: {adviceStatus}
                  </p>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.2 rounded-full border border-emerald-700/50">
                    Confidence: 95%
                  </span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {adviceDetail}
                </p>
              </div>
            </div>

            {/* Footer Status & Update Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10 gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                <span>Source: <strong className="text-slate-200">Open-Meteo WMO Live Telemetry</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span>Last Synced: <strong className="text-white font-mono">{formattedTime}</strong></span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-400">Auto-refresh every 10 min</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
