import React from 'react';
import { TrendingDown, Truck, CloudRain, Layers } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ProblemSection() {
  const { t } = useLanguage();

  const problems = [
    {
      icon: TrendingDown,
      title: t('problem.marketUncertaintyTitle'),
      desc: t('problem.marketUncertaintyDesc'),
      color: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    {
      icon: Truck,
      title: t('problem.transportCostTitle'),
      desc: t('problem.transportCostDesc'),
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      icon: CloudRain,
      title: t('problem.weatherUncertaintyTitle'),
      desc: t('problem.weatherUncertaintyDesc'),
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      icon: Layers,
      title: t('problem.complexityTitle'),
      desc: t('problem.complexityDesc'),
      color: 'text-primary bg-primary-50 border-primary/20',
    },
  ];

  return (
    <section 
      id="problem" 
      className="py-16 sm:py-20 bg-secondary/50 border-y border-border"
      aria-labelledby="problem-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="badge-tag bg-surface text-primary border border-border">
            {t('problem.sectionTag')}
          </span>
          <h2 id="problem-heading" className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
            {t('problem.title')}
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            {t('problem.subtitle')}
          </p>
        </div>

        {/* 4 Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="card-harvest p-6 space-y-4 bg-surface hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-base sm:text-lg text-text">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
