import React from 'react';
import { 
  Sprout, 
  TrendingUp, 
  CloudSunRain, 
  Truck, 
  Calculator, 
  Bot, 
  MapPin, 
  ShieldCheck,
  Send
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function DashboardPreview() {
  const { t } = useLanguage();

  return (
    <section 
      id="dashboard-preview" 
      className="py-16 sm:py-24"
      aria-labelledby="preview-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            {t('dashboardPreview.sectionTag')}
          </span>
          <h2 id="preview-heading" className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
            {t('dashboardPreview.title')}
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            {t('dashboardPreview.subtitle')}
          </p>
        </div>

        {/* Mock Dashboard Frame */}
        <div className="card-harvest max-w-5xl mx-auto border-2 border-border shadow-xl overflow-hidden bg-background">
          {/* Top Demo Bar */}
          <div className="bg-primary-dark text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" aria-hidden="true"></span>
              <span className="text-xs font-bold uppercase tracking-wider">
                {t('dashboardPreview.badge')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              <span>{t('dashboardPreview.demoDataTag')} • Fictional Values for Demo</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header / Profile Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                  👨‍🌾
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text">
                    {t('dashboardPreview.welcome')}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>{t('dashboardPreview.farmerLocation')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge-tag bg-secondary text-primary-dark border border-border text-xs">
                  Active Lot #402
                </span>
                <span className="badge-tag bg-success/10 text-success border border-success/20 text-xs">
                  Ready to Sell
                </span>
              </div>
            </div>

            {/* 3 Overview Stat Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Widget 1: Crop & Price */}
              <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted uppercase">
                    {t('dashboardPreview.cropOverview')}
                  </span>
                  <Sprout className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-text">
                    {t('dashboardPreview.tomatoesLabel')}
                  </p>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {t('dashboardPreview.tomatoesWeight')} • {t('dashboardPreview.marketRate')}
                  </p>
                </div>
              </div>

              {/* Widget 2: Weather */}
              <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted uppercase">
                    {t('dashboardPreview.weatherTitle')}
                  </span>
                  <CloudSunRain className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-text">
                    {t('dashboardPreview.weatherTemp')}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {t('dashboardPreview.weatherSummary')}
                  </p>
                </div>
              </div>

              {/* Widget 3: Estimated Revenue */}
              <div className="p-4 rounded-xl bg-primary-50 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-dark uppercase">
                    {t('dashboardPreview.estRevenueTitle')}
                  </span>
                  <Calculator className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-primary-dark">
                    {t('dashboardPreview.estRevenueValue')}
                  </p>
                  <p className="text-[11px] text-primary/80 mt-0.5">
                    {t('dashboardPreview.estRevenueBreakdown')}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section: Mandi Comparison Bars & Transport */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Mandi Price Visual Comparison (Tailwind Bar Representation) */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-surface border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-sm text-text">
                      {t('dashboardPreview.marketComparisonTitle')}
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted font-medium">Per Quintal / kg</span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Local Yard */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{t('dashboardPreview.mandiLocal')}</span>
                      <span className="font-bold">{t('dashboardPreview.mandiLocalPrice')}</span>
                    </div>
                    <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                      <div className="bg-muted/60 h-full rounded-full w-[70%]"></div>
                    </div>
                  </div>

                  {/* Regional Mandi */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-primary font-semibold flex items-center gap-1">
                        {t('dashboardPreview.mandiRegional')}
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">Best Price</span>
                      </span>
                      <span className="font-extrabold text-primary">{t('dashboardPreview.mandiRegionalPrice')}</span>
                    </div>
                    <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full w-[90%]"></div>
                    </div>
                  </div>

                  {/* Terminal Yard */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{t('dashboardPreview.mandiTerminal')}</span>
                      <span className="font-bold">{t('dashboardPreview.mandiTerminalPrice')}</span>
                    </div>
                    <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                      <div className="bg-accent h-full rounded-full w-[80%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Transport Pool Card */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-surface border border-border space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-sm text-text">
                      {t('dashboardPreview.transportTitle')}
                    </h4>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {t('dashboardPreview.transportTripsAvailable')}
                  </p>

                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-blue-950">
                      <span>Pickup: Tomorrow 6:00 AM</span>
                      <span>Vehicle: Tata 407</span>
                    </div>
                    <p className="text-blue-800 text-[11px]">
                      Share freight with 2 other farmers to save up to 45% on diesel.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-[11px] font-semibold text-primary">
                  Status: Route Matches Destination Mandi
                </div>
              </div>
            </div>

            {/* Bottom: Mitra Assistant Chat Snippet */}
            <div className="p-4 rounded-2xl bg-secondary/80 border border-border flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-text mb-0.5">
                  {t('dashboardPreview.mitraTitle')}
                </p>
                <p className="text-muted leading-relaxed">
                  "{t('dashboardPreview.mitraSampleAnswer')}"
                </p>
              </div>
              <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
                <input
                  type="text"
                  disabled
                  placeholder={t('dashboardPreview.mitraQuestionPlaceholder')}
                  className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl bg-surface border border-border text-muted cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  aria-label="Send"
                  className="p-2 rounded-xl bg-primary text-white opacity-60 cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
