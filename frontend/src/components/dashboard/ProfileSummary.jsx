import React from 'react';
import { MapPin, Globe, Sprout, Scale, Layers, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { dashboardDemoData } from '../../data/dashboardDemoData';

export default function ProfileSummary() {
  const { t } = useLanguage();
  const farmer = dashboardDemoData.farmer;

  const profileItems = [
    {
      label: 'Location',
      value: farmer.location,
      icon: MapPin,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      label: 'Main Crop',
      value: t('dashboard.profile.mainCrop', farmer.crop),
      icon: Sprout,
      color: 'text-primary bg-primary-50 border-primary/20',
    },
    {
      label: 'Current Harvest',
      value: t('dashboard.profile.currentHarvest', farmer.quantity),
      icon: Scale,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: 'Farm Size',
      value: t('dashboard.profile.farmSize', farmer.farmSize),
      icon: Layers,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      label: 'Language',
      value: t('dashboard.profile.preferredLanguage', farmer.language),
      icon: Globe,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Typical Harvest',
      value: t('dashboard.profile.typicalHarvest', farmer.typicalHarvest),
      icon: CheckCircle,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="card-harvest p-5 sm:p-6 bg-surface border-border space-y-5">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            🌾
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text">
              {t('dashboard.profile.cardTitle')}
            </h2>
            <p className="text-xs text-muted">
              {t('dashboard.profile.farmerName', farmer.name)} • {farmer.location}
            </p>
          </div>
        </div>

        <span className="badge-tag bg-secondary text-primary-dark border border-border text-xs">
          {t('dashboard.demoData')}
        </span>
      </div>

      {/* Grid of Profile Information */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {profileItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              className="p-3 rounded-xl bg-secondary/60 border border-border/80 flex flex-col justify-between space-y-2 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted tracking-tight">
                  {item.label}
                </span>
                <div className={`p-1 rounded-md border ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-text truncate" title={item.value}>
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
