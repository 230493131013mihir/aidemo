import React from 'react';
import { Sparkles, UserCheck, MapPin, TrendingUp, Truck, Sun } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getTimeGreeting } from '../../utils/greeting';
import LanguageSelector from '../common/LanguageSelector';

export default function DashboardHeader() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { greeting, icon } = getTimeGreeting();

  // If user is logged in, use their real name; otherwise friendly greeting for guest
  const displayName = user?.name || 'Kisan Mitra';
  const firstName = isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Kisan Mitra';
  const initials = isAuthenticated && user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'KM';

  const roleTitle = isAuthenticated && user?.role
    ? user.role === 'admin'
      ? 'APMC Administrator'
      : user.role === 'transporter'
      ? 'Transporter / Driver'
      : 'Verified Farmer'
    : 'Farmer / Producer';

  const farmerCrop = user?.FarmerProfile?.mainCrop || 'Farm Produce';
  const farmerDistrict = user?.FarmerProfile?.district || 'Regional';

  return (
    <header className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white mb-6">
      {/* Background Photographic Image with Rich Agricultural Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
      />
      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-emerald-950/80 to-slate-900/65 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-radial-at-t from-emerald-500/10 via-transparent to-black/40 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Greeting & Mission */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Live APMC Agritech Engine</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{farmerDistrict} APMC Zone</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {isAuthenticated ? `${greeting}, ${firstName}! ${icon}` : `Welcome to HarvestMitra AI! ${icon}`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm max-w-xl">
            Real-time daily mandi rates, predictive harvest revenue, and shared freight pooling designed for India&apos;s farming community.
          </p>

          {/* Quick Stats Pill Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Primary Crop: <strong className="text-white font-semibold">{farmerCrop}</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 font-medium">
              <Truck className="w-3.5 h-3.5 text-amber-300" />
              <span>Shared Freight: <strong className="text-white font-mono">~40% Savings</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 font-medium">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Telemetry: <strong className="text-white">Live Open-Meteo</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Language Controls & User Badge */}
        <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
          <div className="bg-slate-900/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <LanguageSelector id="dashboard-hero-lang-selector" />
          </div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-primary text-white flex items-center justify-center font-black text-sm shadow-md">
              {initials}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-tight">{displayName}</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
