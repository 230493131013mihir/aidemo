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
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            <span>Mandi Price Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('markets.title', 'Maharashtra APMC Mandi Rates')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('markets.subtitle', 'Live wholesale price discovery across Maharashtra APMC yards (Pune, Nashik, Vashi, Kolhapur, Nagpur).')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Voice / Text Search Input in Header */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-border shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="markets-page-search"
                type="text"
                placeholder={t('markets.voiceSearchPlaceholder', 'Speak or search crop...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-border rounded-xl text-text focus:outline-none focus:bg-white focus:border-primary w-44 sm:w-56"
              />
            </div>
            <VoiceSearchButton
              id="markets-page-voice-search-btn"
              onResult={(transcript) => setSearchQuery(transcript)}
            />
          </div>

          <span className="badge-tag bg-primary/10 text-primary border border-primary/20 hidden md:inline-flex">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Live APMC Mandi Data</span>
          </span>
        </div>
      </div>

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
