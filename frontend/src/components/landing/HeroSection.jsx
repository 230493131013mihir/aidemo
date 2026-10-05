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
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section 
      id="hero" 
      className="py-12 sm:py-16 lg:py-20 relative overflow-hidden"
      aria-labelledby="hero-main-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading, Subtitle, CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Tagline / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-primary-dark shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              <span>{t('hero.badge')}</span>
              <span className="w-1 h-1 rounded-full bg-muted"></span>
              <span className="text-muted">{t('common.statusReady')}</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-3">
              <h1 
                id="hero-main-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.12]"
              >
                {t('hero.title')}{' '}
                <span className="text-primary underline decoration-accent/60 decoration-wavy decoration-2">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed pt-1">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                to="/dashboard"
                id="hero-primary-cta"
                className="btn-primary w-full sm:w-auto text-base px-6 py-3 shadow-md hover:shadow-lg transition-all"
              >
                <span>{t('hero.getStarted')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                to="/dashboard"
                id="hero-secondary-cta"
                className="btn-secondary w-full sm:w-auto text-base px-6 py-3"
              >
                <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{t('hero.exploreDemo')}</span>
              </Link>
            </div>

            {/* Trust points */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2 text-xs text-muted">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                <span>Deterministic calculations • No hallucinated prices</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                <span>Native English, ગુજરાતી, हिन्दी, मराठी support</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual - Dashboard Card Representation */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md card-harvest p-6 sm:p-7 space-y-5 relative bg-surface border-border shadow-lg">
              {/* Demo Data Watermark / Badge */}
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" aria-hidden="true"></span>
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    {t('hero.demoBadge')}
                  </span>
                </div>
                <span className="badge-tag bg-secondary text-muted border border-border text-[10px]">
                  {t('hero.demoDataLabel')}
                </span>
              </div>

              {/* Crop & Quantity Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-text">
                    {t('hero.cropName')}
                  </h3>
                  <span className="badge-tag bg-primary-50 text-primary border border-primary/20">
                    {t('hero.cropWeight')}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Harvest Lot #HM-2026-TOM500
                </p>
              </div>

              {/* 2x2 Grid of Key Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Metric 1: Market Price */}
                <div className="p-3.5 rounded-xl bg-secondary/80 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-muted text-[11px] font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>{t('hero.mandiPriceLabel')}</span>
                  </div>
                  <p className="text-xl font-extrabold text-text">
                    {t('hero.mandiPriceValue')}
                  </p>
                  <p className="text-[10px] text-muted">Regional APMC Rate</p>
                </div>

                {/* Metric 2: Estimated Revenue */}
                <div className="p-3.5 rounded-xl bg-primary-50 border border-primary/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-primary text-[11px] font-semibold">
                    <Calculator className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>{t('hero.estimatedRevenueLabel')}</span>
                  </div>
                  <p className="text-xl font-extrabold text-primary-dark">
                    {t('hero.estimatedRevenueValue')}
                  </p>
                  <p className="text-[10px] text-primary/80">Gross Yield Estimate</p>
                </div>

                {/* Metric 3: Weather */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-semibold">
                    <CloudSunRain className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>{t('hero.weatherLabel')}</span>
                  </div>
                  <p className="text-xs font-bold text-amber-950">
                    28°C • Clear Sky
                  </p>
                  <p className="text-[10px] text-amber-800/90 leading-tight">
                    {t('hero.weatherStatus')}
                  </p>
                </div>

                {/* Metric 4: Shared Transport */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-800 text-[11px] font-semibold">
                    <Truck className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>{t('hero.transportLabel')}</span>
                  </div>
                  <p className="text-xs font-bold text-blue-950">
                    Pool Available
                  </p>
                  <p className="text-[10px] text-blue-800/90 leading-tight">
                    {t('hero.transportStatus')}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="pt-2 border-t border-border/80 flex items-start gap-2 text-[10px] text-muted">
                <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-tight">
                  {t('hero.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
