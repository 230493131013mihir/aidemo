import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, UserCheck, MapPin, TrendingUp, Truck, Sun, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from '../common/LanguageSelector';

export default function DashboardHeader() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  // If user is logged in, use their real name; otherwise friendly greeting for guest
  const displayName = user?.name || 'Kisan Mitra';
  const firstName = isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Mihir';
  const initials = isAuthenticated && user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'MJ';

  const roleTitle = isAuthenticated && user?.role
    ? user.role === 'admin'
      ? 'APMC Administrator'
      : user.role === 'transporter'
      ? 'Transporter / Driver'
      : 'Verified Farmer'
    : 'Farmer / Producer';

  const farmerCrop = user?.FarmerProfile?.mainCrop || 'Tomato';
  const farmerDistrict = user?.FarmerProfile?.district || 'Pune';

  return (
    <header className="relative rounded-3xl shadow-xl border border-emerald-900/40 text-white mb-6 overflow-hidden">
      {/* Background Photographic Image with Rich Agricultural Overlay (clipped inside) */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
        />
        {/* Consistent High-Contrast Dark Translucent Overlays */}
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-emerald-950/75" />
        <div className="absolute inset-0 bg-radial-at-t from-emerald-500/10 via-transparent to-black/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Greeting & Mission */}
        <div className="space-y-3 max-w-2xl">
          {/* Badges Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Kisan Decision Portal</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 text-slate-100 border border-white/20 text-xs font-semibold backdrop-blur-md shadow-xs">
              <MapPin className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              <span>{farmerDistrict} APMC Zone</span>
            </span>
          </div>

          {/* Main Heading - Guaranteed Pure White (#FFFFFF) & Bold */}
          <h1 
            className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Namaste, {firstName}! 🙏
          </h1>

          {/* Supporting Description - Guaranteed High Contrast (#F1F5F9) */}
          <p 
            className="text-xs sm:text-sm md:text-base leading-relaxed drop-shadow-sm max-w-xl font-normal"
            style={{ color: '#F1F5F9' }}
          >
            Check today&apos;s market rates, find verified transport, or ask Mitra AI for guidance.
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

        {/* Right: Controls & User Badge */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 relative z-30">
          <div className="flex items-center gap-2">
            {/* Ask Mitra AI Button */}
            <Link
              to="/chat"
              id="hero-ask-mitra-ai-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all border border-emerald-400/40 hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Ask Mitra AI</span>
            </Link>

            {/* Notification Button */}
            <button
              type="button"
              id="hero-notifications-btn"
              aria-label={t('nav.notifications') || "Notifications"}
              title="Notifications"
              className="relative p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/20 text-slate-100 transition-colors cursor-pointer shadow-sm"
            >
              <Bell className="w-4 h-4 text-slate-100" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" aria-hidden="true" />
            </button>

            {/* Language Selector */}
            <div className="bg-slate-900/70 backdrop-blur-md p-1 rounded-xl border border-white/20 relative z-30">
              <LanguageSelector id="dashboard-hero-lang-selector" />
            </div>
          </div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/20 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              {initials}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-tight">{displayName}</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              </div>
              <span className="text-[10px] font-semibold text-emerald-200 leading-tight block">
                {roleTitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
