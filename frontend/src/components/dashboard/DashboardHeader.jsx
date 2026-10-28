import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bot, Bell, Mic, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export default function DashboardHeader() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  const farmerName = isAuthenticated && user?.name ? user.name : 'Kisan Mitra';
  const profile = user?.FarmerProfile;
  const locationDistrict = profile?.district || 'Pune';
  const locationState = profile?.state || 'Maharashtra';

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
    <header className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-800/40 text-white animate-fade-slide-up">
      {/* High-Quality Indian Farmland Background with cover positioning & responsive overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-emerald-950/88 to-teal-950/80 backdrop-blur-[1px]" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Greeting, Welcome Message & Simple Location */}
        <div className="space-y-2.5 max-w-2xl">
          {/* Location indicator & Agri tag */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-200 text-xs sm:text-sm font-semibold border border-emerald-400/30">
              <MapPin className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
              <span>{locationDistrict}, {locationState}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium border border-white/15 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kisan Decision Portal</span>
            </span>
          </div>

          {/* Namaste, Farmer Name */}
          <h1 className="farmer-title text-white tracking-tight drop-shadow-md">
            {greetingPrefix}, {farmerName}!
          </h1>

          {/* Simple, clear welcome text */}
          <p className="farmer-body text-emerald-100 max-w-xl drop-shadow-xs">
            {welcomeMessage}
          </p>
        </div>

        {/* Right: Notification Pill (only if notifications exist) & One Prominent "Ask Mitra AI" Action */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Notification Icon (ONLY when relevant notifications exist) */}
          {notificationCount > 0 && (
            <Link
              to="/dashboard#mandi-bookings"
              className="relative p-3.5 rounded-2xl bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30 transition-all flex items-center gap-2 font-bold text-sm btn-press"
              title={`${notificationCount} new procurement inquiry`}
              aria-label={`${notificationCount} new mandi procurement notices`}
            >
              <Bell className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>{notificationCount} New</span>
            </Link>
          )}

          {/* Prominent "Ask Mitra AI" Action */}
          <Link
            to="/chat"
            id="header-ask-mitra-btn"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 hover:shadow-2xl transition-all shadow-lg font-black text-base sm:text-lg cursor-pointer btn-press ai-glow-subtle"
          >
            <Mic className="w-5 h-5 text-emerald-700" aria-hidden="true" />
            <span>Ask Mitra AI</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
