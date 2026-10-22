import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Truck, 
  CloudSunRain, 
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Compass,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section 
      id="hero" 
      className="relative min-h-[85vh] flex items-center overflow-hidden py-16 sm:py-24 text-white"
      aria-labelledby="hero-main-heading"
    >
      {/* 1. Cinematic Photographic Background with Agricultural Landscape */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('/images/landing-hero.jpg')` }}
      />
      {/* Deep Gradient Overlay with Dark Emerald and Midnight Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/90 to-slate-900/80 backdrop-blur-[0.5px]" />
      <div className="absolute inset-0 bg-radial-at-t from-emerald-500/15 via-transparent to-black/60 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading, Subtitle, CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Tagline / Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-300 shadow-md backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" aria-hidden="true" />
              <span>{t('hero.badge')}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
              <span className="text-white/80">{t('common.statusReady')}</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-3">
              <h1 
                id="hero-main-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-lg"
              >
                {t('hero.title')}{' '}
                <span className="text-emerald-400 underline decoration-amber-400/80 decoration-wavy decoration-2">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-200/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed pt-1 drop-shadow-sm">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* Dedicated Farmer Access CTAs (Register / Login Required) */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                to="/register"
                id="hero-register-cta"
                className="btn-primary w-full sm:w-auto text-base px-8 py-3.5 shadow-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2 group bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserPlus className="w-5 h-5" aria-hidden="true" />
                <span>Register Farmer Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>

              <Link
                to="/login"
                id="hero-login-cta"
                className="w-full sm:w-auto text-base px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/25 backdrop-blur-md transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <LogIn className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Farmer Login</span>
              </Link>
            </div>

            {/* Strict Authentication Assurance Notice */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-300 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified APMC Rates & Logistics — Log in or register to access full dashboard intelligence</span>
            </div>

            {/* Trust points */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2 text-xs text-slate-200/90 bg-black/20 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Deterministic calculations • No hallucinated rates</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200/90 bg-black/20 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Native English, ગુજરાતી, हिन्दी, मराठी support</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual - 3D Glassmorphic Live Engine Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div 
              className="w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 relative bg-slate-900/80 border border-emerald-500/30 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-400/50"
              style={{
                transform: 'perspective(1000px) rotateY(-2deg) rotateX(1deg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)'
              }}
            >
              {/* Card Header Badge */}
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" aria-hidden="true"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {t('hero.demoBadge')}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  {t('hero.demoDataLabel')}
                </span>
              </div>

              {/* Crop & Quantity Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xl text-white">
                    {t('hero.cropName')}
                  </h3>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold font-mono">
                    {t('hero.cropWeight')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                  <span>Surat APMC Mandi Hub</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Active Today</span>
                </p>
              </div>

              {/* 2x2 Grid of Key Metrics with Glassmorphic Panels */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Metric 1: Market Price */}
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>{t('hero.mandiPriceLabel')}</span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">
                    {t('hero.mandiPriceValue')}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-medium">Surat APMC Modal</p>
                </div>

                {/* Metric 2: Estimated Revenue */}
                <div className="p-3.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 space-y-1 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold">
                    <Calculator className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>{t('hero.estimatedRevenueLabel')}</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-300 font-mono">
                    {t('hero.estimatedRevenueValue')}
                  </p>
                  <p className="text-[10px] text-slate-300 font-medium">Net Take-Home</p>
                </div>

                {/* Metric 3: Weather */}
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/25 space-y-1 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold">
                    <CloudSunRain className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    <span>{t('hero.weatherLabel')}</span>
                  </div>
                  <p className="text-xs font-bold text-white">
                    28°C • Optimal Harvest
                  </p>
                  <p className="text-[10px] text-amber-200/90 leading-tight">
                    {t('hero.weatherStatus')}
                  </p>
                </div>

                {/* Metric 4: Shared Transport */}
                <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-400/25 space-y-1 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-blue-300 text-[11px] font-semibold">
                    <Truck className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    <span>{t('hero.transportLabel')}</span>
                  </div>
                  <p className="text-xs font-bold text-white">
                    Pool Available (~40% off)
                  </p>
                  <p className="text-[10px] text-blue-200/90 leading-tight">
                    {t('hero.transportStatus')}
                  </p>
                </div>
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified APMC Data</span>
                </span>
                <span className="font-mono text-emerald-300">
                  Daily Live Sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

