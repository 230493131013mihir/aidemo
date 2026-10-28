import React, { useState } from 'react';
import { TrendingUp, Sparkles, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import MarketPriceExplorer from '../components/market/MarketPriceExplorer';
import VoiceSearchButton from '../components/common/VoiceSearchButton';

export default function MarketsPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectMarketForSimulator = (market) => {
    navigate('/harvest', { state: { selectedMarket: market } });
  };

  return (
    <div className="space-y-6 w-full max-w-full 2xl:max-w-[1720px] mx-auto py-4 sm:py-6 px-2 sm:px-4">
      {/* 1. Photographic Mandi Market Intelligence Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/30 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/mandi-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/90 to-amber-950/80 backdrop-blur-[1px]" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('markets.badge', 'Mandi Price Intelligence')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {t('markets.title', 'Maharashtra APMC Mandi Rates')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed drop-shadow-sm">
              {t('markets.subtitle', 'Live wholesale price discovery across Maharashtra APMC yards (Pune, Nashik, Vashi, Kolhapur, Nagpur).')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Voice / Text Search Input in Header */}
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="markets-page-search"
                  type="text"
                  placeholder={t('markets.voiceSearchPlaceholder', 'Speak or search crop...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-border rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-primary w-44 sm:w-56 font-medium"
                />
              </div>
              <VoiceSearchButton
                id="markets-page-voice-search-btn"
                onResult={(transcript) => setSearchQuery(transcript)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Price Explorer */}
      <div className="w-full">
        <MarketPriceExplorer
          key={searchQuery}
          initialSearchQuery={searchQuery}
          selectedLanguage={language || 'en'}
          onSelectMarketForSimulator={handleSelectMarketForSimulator}
        />
      </div>
    </div>
  );
}
