import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Calculator, CloudSunRain, Bot, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function QuickActions() {
  const { t } = useLanguage();

  const actions = [
    {
      title: t('dashboard.quickActions.compareMarkets'),
      to: '/markets',
      icon: TrendingUp,
      desc: 'APMC rate comparison',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: t('dashboard.quickActions.simulateHarvest'),
      to: '/harvest',
      icon: Calculator,
      desc: 'Net revenue calculator',
      color: 'text-primary bg-primary-50 border-primary/20',
    },
    {
      title: t('dashboard.quickActions.checkWeather'),
      to: '/weather',
      icon: CloudSunRain,
      desc: 'Rain & harvest advisory',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      title: t('dashboard.quickActions.askMitra'),
      to: '/chat',
      icon: Bot,
      desc: 'Multilingual voice AI',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-text">
          {t('dashboard.quickActions.title')}
        </h3>
        <span className="text-xs text-muted">Module Shortcuts</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <Link
              key={idx}
              to={act.to}
              className="card-harvest p-4 bg-surface border-border flex flex-col justify-between group hover:border-primary/50 hover:bg-secondary/30 transition-all"
            >
              <div className="space-y-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${act.color}`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-text group-hover:text-primary transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-muted truncate">
                    {act.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-semibold text-primary">
                <span>Launch</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
