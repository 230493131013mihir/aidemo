import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calculator, 
  Truck, 
  CloudSunRain, 
  Bot, 
  User, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar({ className = '' }) {
  const { t } = useLanguage();

  const navigationSections = [
    {
      title: 'Analytics & Planning',
      items: [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/markets', label: t('nav.markets'), icon: TrendingUp },
        { to: '/harvest', label: t('nav.harvest'), icon: Calculator },
      ]
    },
    {
      title: 'Operations & Intelligence',
      items: [
        { to: '/transport', label: t('nav.transport'), icon: Truck },
        { to: '/weather', label: t('nav.weather'), icon: CloudSunRain },
        { to: '/chat', label: t('nav.chat'), icon: Bot, badge: 'AI' },
      ]
    },
    {
      title: 'Account',
      items: [
        { to: '/profile', label: t('nav.profile'), icon: User },
      ]
    }
  ];

  return (
    <aside 
      className={`w-64 shrink-0 bg-surface border-r border-border flex flex-col justify-between p-4 ${className}`}
      aria-label="Dashboard sidebar navigation"
    >
      <div className="space-y-6">
        {/* Farmer Status Pill */}
        <div className="p-3 rounded-xl bg-secondary/80 border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            🌾
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text truncate">
              {t('dashboard.greeting')}
            </p>
            <p className="text-[11px] text-muted truncate">
              {t('common.roleFarmer')}
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        {navigationSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted/80">
              {section.title}
            </div>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-primary text-white shadow-xs font-semibold'
                          : 'text-text hover:bg-secondary hover:text-primary'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-accent/20 text-accent group-hover:bg-accent group-hover:text-black transition-colors">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Version & Status */}
      <div className="pt-4 border-t border-border">
        <div className="p-3 rounded-xl bg-primary-50 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold text-primary-dark">HarvestMitra Core</span>
          </div>
          <span className="badge-tag bg-white text-primary border border-primary/20">
            ISSUE-04
          </span>
        </div>
      </div>
    </aside>
  );
}
