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
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1720px] mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* Module Hero Banner — Sky Blue / Leaf Green Identity with Atmospheric Sky & Fields Visual */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-sky-800/40 text-white animate-fade-slide-up">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/weather-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-sky-950/88 to-emerald-950/80 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <CloudSunRain className="w-3.5 h-3.5 text-sky-400" />
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
            <span className="badge-tag bg-sky-500/20 text-sky-200 border border-sky-400/30 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
              <span>{t('weather.liveBadge', 'Live Rain Advisory Active')}</span>
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
