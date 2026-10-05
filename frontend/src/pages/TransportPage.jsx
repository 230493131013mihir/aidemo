import React from 'react';
import { Truck, Sparkles, Clock, Users, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TransportPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" aria-hidden="true" />
            <span>Shared Logistics & Capacity Pooling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('transport.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('transport.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ISSUE-08 Planned</span>
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
            {t('transport.note')}
          </p>
        </div>
      </div>

      {/* Mock Pool Card Preview */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-text">
          Preview: Coordinated Vehicle Pooling Card
        </h2>

        <div className="card-harvest p-6 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </span>
              <div>
                <p className="font-bold text-sm text-text">Tata 407 (Medium Freight)</p>
                <p className="text-xs text-muted">Driver: Ramesh Patel • 4.8 ★</p>
              </div>
            </div>
            <span className="badge-tag bg-success/10 text-success border border-success/20">
              1.8 Tons Available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 text-muted">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>Route: Mehsana ➔ Ahmedabad APMC</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Users className="w-4 h-4 text-accent shrink-0" />
              <span>2 Farmers Joined (Save 45%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
