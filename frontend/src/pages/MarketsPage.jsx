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
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Module Hero Banner — Emerald / Teal Identity with Fresh Agricultural Market Visual */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-teal-800/40 text-white animate-fade-slide-up">
        {/* Photographic Mandi Produce Background with cover & responsive overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/mandi-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-teal-950/88 to-emerald-950/80 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Mandi Price Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {t('markets.title', 'Maharashtra APMC Mandi Rates')}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 font-medium leading-relaxed drop-shadow-xs">
              Compare available crop prices before deciding where to sell.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Voice / Text Search Input in Header */}
            <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md p-1.5 rounded-2xl border border-teal-500/30 shadow-lg">
              <div className="relative">
                <Search className="w-4 h-4 text-teal-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="markets-page-search"
                  type="text"
                  placeholder={t('markets.voiceSearchPlaceholder', 'Speak or search crop...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-900/80 border border-teal-500/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 w-44 sm:w-56"
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
