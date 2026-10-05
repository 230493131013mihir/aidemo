import React from 'react';
import { 
  CloudSunRain, 
  Droplets, 
  CloudRain, 
  MapPin, 
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardDemoData } from '../../data/dashboardDemoData';

export default function WeatherWidget() {
  const { t } = useLanguage();
  const weather = dashboardDemoData.weather;

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-accent flex items-center justify-center border border-amber-200">
            <CloudSunRain className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-base text-text">
              {t('dashboard.weather.title')}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted">
              <MapPin className="w-3 h-3 text-primary" aria-hidden="true" />
              <span>{weather.location}</span>
            </div>
          </div>
        </div>

        <span className="badge-tag bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
          {t('dashboard.weather.badge')}
        </span>
      </div>

      {/* Main Temperature & Condition Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/60 border border-border/80">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/60 text-amber-800 flex items-center justify-center border border-amber-200 shadow-2xs">
            <CloudSunRain className="w-8 h-8 text-accent" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-text">
                {weather.temperature}°C
              </span>
              <span className="text-sm font-semibold text-muted">
                {t('dashboard.weather.condition')}
              </span>
            </div>
            <p className="text-xs text-muted">
              Typical for Surat Rabi Season
            </p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-surface border border-border/80 space-y-0.5">
            <div className="flex items-center gap-1 text-muted text-[11px]">
              <Droplets className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
              <span>{t('dashboard.weather.humidityLabel')}</span>
            </div>
            <p className="font-bold text-sm text-text">{weather.humidity}%</p>
          </div>

          <div className="p-2.5 rounded-xl bg-surface border border-border/80 space-y-0.5">
            <div className="flex items-center gap-1 text-muted text-[11px]">
              <CloudRain className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>{t('dashboard.weather.rainProbabilityLabel')}</span>
            </div>
            <p className="font-bold text-sm text-text">{weather.rainProbability}%</p>
          </div>
        </div>
      </div>

      {/* Weather Planning Message */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
        <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="font-bold text-amber-900">
            {t('dashboard.weather.planningReminderTitle')}
          </p>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            {t('dashboard.weather.planningReminderNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
