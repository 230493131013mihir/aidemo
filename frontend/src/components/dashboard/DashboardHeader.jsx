import React from 'react';
import { Bell, Sparkles, UserCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../common/LanguageSelector';
import { dashboardDemoData } from '../../data/dashboardDemoData';

export default function DashboardHeader() {
  const { t } = useLanguage();
  const farmer = dashboardDemoData.farmer;

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border/80">
      {/* Left: Greeting & Subtitle */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {t('dashboard.greeting', `Good morning, ${farmer.name.split(' ')[0]}`)}
          </h1>
          <span className="badge-tag bg-amber-100/80 text-amber-900 border border-amber-300/80 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>{t('dashboard.hackathonDemo')}</span>
          </span>
        </div>
        <p className="text-sm text-muted">
          {t('dashboard.headerSubtitle')}
        </p>
      </div>

      {/* Right: Controls & Profile Badge */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Language Selector */}
        <LanguageSelector id="dashboard-header-lang-selector" />

        {/* Notification Icon */}
        <button
          type="button"
          aria-label={t('nav.notifications')}
          title="Demo Notifications"
          className="relative p-2 rounded-xl bg-surface border border-border text-muted hover:text-text hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" aria-hidden="true"></span>
        </button>

        {/* Farmer Avatar / Role Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            RP
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-text leading-tight">{farmer.name}</span>
            <span className="text-[10px] text-muted leading-tight">{t('dashboard.profile.farmerRole')}</span>
          </div>
          <UserCheck className="w-3.5 h-3.5 text-primary shrink-0 hidden sm:inline" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
