import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import MarketPriceExplorer from '../components/market/MarketPriceExplorer';

export default function MarketsPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

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
            {t('markets.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('markets.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Live APMC Mandi Data</span>
          </span>
        </div>
      </div>

      {/* Live Market Price Explorer */}
      <div className="w-full">
        <MarketPriceExplorer
          selectedLanguage={language || 'en'}
          onSelectMarketForSimulator={handleSelectMarketForSimulator}
        />
      </div>
    </div>
  );
}
