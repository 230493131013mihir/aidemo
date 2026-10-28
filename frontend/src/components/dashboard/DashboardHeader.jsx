import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Bell, Mic, TrendingUp, Truck, Sun } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from '../common/LanguageSelector';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export default function DashboardHeader() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  const farmerName = isAuthenticated && user?.name ? user.name : 'Kisan Mitra';
  const firstName = isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Mihir';
  const profile = user?.FarmerProfile;
  const locationDistrict = profile?.district || 'Pune';
  const locationState = profile?.state || 'Maharashtra';
  const farmerCrop = profile?.mainCrop || 'Tomato';

  // Check for relevant active notifications (e.g. pending Mandi procurement offers or weather warnings)
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'farmer') return;

    let isMounted = true;
    async function fetchNotifications() {
      try {
        const token = sessionStorage.getItem('harvestmitra_token') || localStorage.getItem('harvestmitra_token');
        if (!token || token === 'guest') return;

        const res = await fetch(`${API_BASE_URL}/api/auth/contact-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && isMounted) {
          const pending = json.data.filter(r => r.contactType === 'mandi_to_farmer' && r.status === 'pending');
          setNotificationCount(pending.length);
        }
      } catch (err) {
        // Silently handle offline/guest mode without fake numbers
      }
    }

    fetchNotifications();
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  // Localized warm greeting: "Namaste, [Farmer Name]"
  const greetingPrefix = language === 'mr' ? 'नमस्कार' : language === 'hi' ? 'नमस्ते' : language === 'gu' ? 'નમસ્તે' : 'Namaste';

  const welcomeMessage = language === 'mr'
    ? 'आजचे बाजार भाव तपासा, वाहतूक शोधा, किंवा पिकाच्या मार्गदर्शनासाठी मित्रा AI ला विचारा.'
    : language === 'hi'
    ? 'आज के मंडी भाव देखें, सुरक्षित परिवहन खोजें, या फसल मार्गदर्शन के लिए मित्रा AI से पूछें।'
    : language === 'gu'
    ? 'આજના બજાર ભાવ જુઓ, પરિવહન શોધો, અથવા પાક માર્ગદર્શન માટે મિત્રા AI ને પૂછો.'
    : "Check today's market rates, find verified transport, or ask Mitra AI for guidance.";

  return (
    <header className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/40 text-white animate-fade-slide-up mb-6">
      {/* Background Photographic Image with Rich Agricultural Overlay (clipped inside) */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
        />
        {/* Consistent High-Contrast Dark Translucent Overlays */}
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/88 to-slate-950/80 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-radial-at-t from-emerald-500/10 via-transparent to-black/60 pointer-events-none" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Greeting, Welcome Message & Simple Location */}
        <div className="space-y-3 max-w-2xl">
          {/* Location indicator & Agri tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Kisan Decision Portal</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/70 text-slate-100 border border-white/20 text-xs font-semibold backdrop-blur-md shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{locationDistrict}, {locationState}</span>
            </span>
          </div>

          {/* Namaste, Farmer Name - Guaranteed Pure White (#FFFFFF) & Bold */}
          <h1 
            className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            {greetingPrefix}, {firstName}! 🙏
          </h1>

          {/* Simple, clear welcome text - Guaranteed High Contrast (#F1F5F9) */}
          <p 
            className="text-xs sm:text-sm md:text-base leading-relaxed drop-shadow-sm max-w-xl font-normal"
            style={{ color: '#F1F5F9' }}
          >
            {welcomeMessage}
          </p>

          {/* Quick Stats Pill Strip */}
          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center gap-2 font-medium text-slate-100 shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Primary Crop: <strong className="text-white font-semibold">{farmerCrop}</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center gap-2 font-medium text-slate-100 shadow-xs">
              <Truck className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Shared Freight: <strong className="text-white font-mono font-semibold">~40% Savings</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/20 flex items-center gap-2 font-medium text-slate-100 shadow-xs">
              <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Telemetry: <strong className="text-white font-semibold">Live Open-Meteo</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Notification Pill, Language Selector & One Prominent "Ask Mitra AI" Action */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 relative z-30">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Notification Icon (when notifications exist, display count pill; otherwise standard bell) */}
            {notificationCount > 0 ? (
              <Link
                to="/dashboard#mandi-bookings"
                id="hero-notifications-btn"
                className="relative p-2.5 px-3.5 rounded-2xl bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30 transition-all flex items-center gap-2 font-bold text-xs sm:text-sm btn-press shadow-sm"
                title={`${notificationCount} new procurement inquiry`}
                aria-label={`${notificationCount} new mandi procurement notices`}
              >
                <Bell className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{notificationCount} New</span>
              </Link>
            ) : (
              <button
                type="button"
                id="hero-notifications-btn"
                aria-label={t('nav.notifications') || "Notifications"}
                title="Notifications"
                className="relative p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/20 text-slate-100 transition-colors cursor-pointer shadow-sm"
              >
                <Bell className="w-4 h-4 text-slate-100" aria-hidden="true" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" aria-hidden="true" />
              </button>
            )}

            {/* Language Selector */}
            <div className="bg-slate-900/70 backdrop-blur-md p-1 rounded-xl border border-white/20 relative z-30">
              <LanguageSelector id="dashboard-hero-lang-selector" />
            </div>

            {/* Prominent "Ask Mitra AI" Action */}
            <Link
              to="/chat"
              id="header-ask-mitra-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg border border-emerald-400/40 hover:scale-[1.02] cursor-pointer transition-all btn-press ai-glow-subtle"
            >
              <Mic className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>Ask Mitra AI</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
