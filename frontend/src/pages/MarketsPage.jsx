import React from 'react';
import { TrendingUp, Sparkles, Clock, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MarketsPage() {
  const { t } = useLanguage();

  const sampleMandis = [
    { crop: 'Wheat (Sharbati)', mandi: 'Unjha APMC', price: '₹2,680 / Qtl', trend: '+3.5%', status: 'Active' },
    { crop: 'Mustard (Yellow)', mandi: 'Rajkot Market Yard', price: '₹5,420 / Qtl', trend: '+1.8%', status: 'Active' },
    { crop: 'Cotton (Medium Staple)', mandi: 'Surendranagar APMC', price: '₹7,150 / Qtl', trend: '-0.4%', status: 'Active' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
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
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('common.statusPlanned')}</span>
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
            {t('markets.note')}
          </p>
        </div>
      </div>

      {/* Preview Card Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-text">
          Preview: Sample Mandi Rate Feeds
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleMandis.map((item, idx) => (
            <div key={idx} className="card-harvest p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted">{item.mandi}</span>
                <span className="badge-tag bg-primary-50 text-primary border border-primary/20">
                  {item.status}
                </span>
              </div>
              <div>
                <p className="font-bold text-base text-text">{item.crop}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-primary">{item.price}</span>
                  <span className="text-xs font-semibold text-success flex items-center">
                    <ArrowUpRight className="w-3 h-3 inline" /> {item.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
