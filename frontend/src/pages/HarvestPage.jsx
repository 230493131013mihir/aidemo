import React from 'react';
import { Calculator, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HarvestPage() {
  const { t } = useLanguage();

  const scenarios = [
    {
      title: 'Option 1: Sell Today',
      desc: 'Sell immediately at nearest local mandi with zero holding risk.',
      badge: 'Immediate Cash',
      color: 'border-border',
    },
    {
      title: 'Option 2: Hold & Sell Later',
      desc: 'Store crop for 7-10 days expecting higher seasonal demand.',
      badge: 'Price Speculation',
      color: 'border-border',
    },
    {
      title: 'Option 3: Transport to Alt Mandi',
      desc: 'Freight produce to higher-paying regional terminal market.',
      badge: 'Higher Net Yield',
      color: 'border-primary/40 bg-primary-50/30',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" aria-hidden="true" />
            <span>Deterministic Math Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('harvest.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('harvest.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ISSUE-07 Planned</span>
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
            {t('harvest.note')}
          </p>
        </div>
      </div>

      {/* Scenario Comparison Architecture Preview */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-text">
          Preview: Planned 3-Way Decision Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((item, idx) => (
            <div key={idx} className={`card-harvest p-5 space-y-3 ${item.color}`}>
              <div className="flex items-center justify-between">
                <span className="badge-tag bg-secondary text-muted border border-border">
                  {item.badge}
                </span>
                <CheckCircle2 className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-text">{item.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
