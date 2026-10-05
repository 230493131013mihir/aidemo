import React from 'react';
import { Clock, Calculator, TrendingUp, Truck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardDemoData } from '../../data/dashboardDemoData';

export default function RecentActivity() {
  const { t } = useLanguage();

  const getIcon = (type) => {
    switch (type) {
      case 'calculator':
        return <Calculator className="w-4 h-4 text-primary" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-emerald-700" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted" />;
    }
  };

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-secondary text-primary">
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-base text-text">
            {t('dashboard.recentActivity.title')}
          </h3>
        </div>
        <span className="badge-tag bg-secondary text-muted border border-border text-[10px]">
          {t('dashboard.recentActivity.badge')}
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {dashboardDemoData.recentActivity.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/80 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border/80 shrink-0">
                {getIcon(item.iconType)}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-text">
                {t(item.actionKey)}
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted bg-surface px-2 py-0.5 rounded-md border border-border/60 shrink-0">
              {t(item.timeKey)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-muted pt-1">
        Demonstration activity log from current session.
      </p>
    </div>
  );
}
