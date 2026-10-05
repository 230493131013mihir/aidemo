import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardDemoData } from '../../data/dashboardDemoData';

export default function TransportSummary() {
  const { t } = useLanguage();
  const transport = dashboardDemoData.transport;

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-base text-text">
            {t('dashboard.transport.title')}
          </h3>
        </div>
        <span className="badge-tag bg-blue-50 text-blue-900 border border-blue-200 text-[10px]">
          {t('dashboard.transport.matchingCount')}
        </span>
      </div>

      {/* Info Details */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/80 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted">{t('dashboard.transport.destinationLabel')}:</span>
            <span className="font-bold text-text">{transport.destination}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-muted">{t('dashboard.transport.estimatedSharedLabel')}:</span>
            <span className="font-semibold text-primary">{t('dashboard.transport.estimatedSharedValue')}</span>
          </div>
        </div>

        <p className="text-[11px] text-muted">
          {transport.savingsSummary}
        </p>
      </div>

      {/* Action */}
      <div className="pt-2 border-t border-border/60">
        <Link
          to="/transport"
          id="btn-dashboard-view-transport"
          className="btn-secondary w-full text-xs py-2 px-3 justify-center gap-1.5 shadow-2xs"
        >
          <span>{t('dashboard.transport.buttonView')}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
