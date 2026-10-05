import React from 'react';
import { CloudSunRain, Sparkles, Clock, Droplets, Wind, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function WeatherPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <CloudSunRain className="w-4 h-4" aria-hidden="true" />
            <span>Weather & Rain Perishability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('weather.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('weather.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open-Meteo API Planned</span>
          </span>
        </div>
      </div>

      {/* Development Roadmap Callout */}
      <div className="p-4 rounded-xl bg-secondary/80 border border-border flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-text">
            {t('common.comingSoon')}
          </p>
          <p className="text-xs text-muted leading-relaxed">
            {t('weather.note')}
          </p>
        </div>
      </div>

      {/* Weather Widget Mock Preview */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-text">
          Preview: Hyperlocal Weather Forecast & Alert Card
        </h2>

        <div className="card-harvest p-6 space-y-5 max-w-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-accent flex items-center justify-center border border-amber-200">
                <CloudSunRain className="w-8 h-8" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-text">28°C</p>
                <p className="text-xs text-muted">Clear Sky • Ahmedabad District, Gujarat</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/10 text-success border border-success/20 text-xs font-semibold">
              <span>Safe for Harvesting</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 text-muted">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>Humidity: 42%</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Wind className="w-4 h-4 text-teal-500" />
              <span>Wind: 12 km/h</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <AlertTriangle className="w-4 h-4 text-accent" />
              <span>Rain Risk: 0%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
