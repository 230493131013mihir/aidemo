import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Sprout, 
  Menu, 
  X, 
  LayoutDashboard, 
  TrendingUp, 
  Calculator, 
  Truck, 
  CloudSunRain, 
  Bot, 
  User,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../common/LanguageSelector';

export default function Navbar() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/markets', label: t('nav.markets'), icon: TrendingUp },
    { to: '/harvest', label: t('nav.harvest'), icon: Calculator },
    { to: '/transport', label: t('nav.transport'), icon: Truck },
    { to: '/weather', label: t('nav.weather'), icon: CloudSunRain },
    { to: '/chat', label: t('nav.chat'), icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Branding */}
          <Link 
            to="/" 
            id="brand-logo"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-text group-hover:text-primary transition-colors">
                Harvest<span className="text-primary">Mitra</span> <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold ml-1">AI</span>
              </span>
              <span className="text-[10px] text-muted font-medium tracking-wide">
                AgriTech Decision System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text hover:text-primary hover:bg-secondary/70'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <LanguageSelector id="header-language-selector" />

            {/* Profile / Demo Shortcut */}
            <NavLink
              to="/profile"
              aria-label={t('nav.profile')}
              className={({ isActive }) =>
                `hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-border transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-surface text-text hover:bg-secondary/70'
                }`
              }
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span className="hidden xl:inline">{t('nav.profile')}</span>
            </NavLink>

            {/* CTA Button */}
            <Link
              to="/dashboard"
              id="cta-dashboard-header"
              className="btn-primary text-sm py-2 px-3.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('nav.getStarted')}</span>
              <span className="sm:hidden">App</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              id="mobile-nav-toggle"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-text hover:bg-secondary/80 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-text" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-text" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu-drawer"
          className="lg:hidden border-t border-border bg-surface px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150"
        >
          <div className="text-xs font-semibold uppercase text-muted tracking-wider px-3 py-1">
            Navigation
          </div>
          <nav className="space-y-1" aria-label="Mobile navigation">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-semibold'
                    : 'text-text hover:bg-secondary'
                }`
              }
            >
              <Sprout className="w-4 h-4" aria-hidden="true" />
              <span>{t('nav.home')}</span>
            </NavLink>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'text-text hover:bg-secondary'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-semibold'
                    : 'text-text hover:bg-secondary'
                }`
              }
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span>{t('nav.profile')}</span>
            </NavLink>
          </nav>

          <div className="pt-3 border-t border-border">
            <div className="text-xs font-semibold uppercase text-muted tracking-wider px-3 mb-2">
              {t('common.selectLanguage')}
            </div>
            <LanguageSelector variant="segmented" className="w-full justify-center" />
          </div>
        </div>
      )}
    </header>
  );
}
