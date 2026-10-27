import React from 'react';
import { CloudSunRain, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import WeatherAdvisoryWidget from '../components/weather/WeatherAdvisoryWidget';

export default function WeatherPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleNavigateToSimulator = (weatherParams) => {
    navigate('/harvest', { state: { weatherParams } });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Photographic Atmospheric Weather Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/weather-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-emerald-950/70 backdrop-blur-[1px]" />
        
        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <CloudSunRain className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('weather.badge', 'District Rain Advisory & Harvest Timing')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {t('weather.pageTitle', 'Agricultural Weather Intelligence')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              {t('weather.pageSubtitle', 'Localized precipitation forecasts, rain probability alerts, and data-backed harvest timing advisories.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-tag bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('weather.liveBadge', 'Live Rain Advisory')}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Live Weather Advisory Widget */}
      <div className="w-full">
        <WeatherAdvisoryWidget
          selectedLanguage={language || 'en'}
          onNavigateToSimulator={handleNavigateToSimulator}
        />
      </div>
    </div>
  );
}
