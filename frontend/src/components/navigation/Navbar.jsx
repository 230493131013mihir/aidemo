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
  Shield, 
  LogOut,
  UserCheck,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from '../common/LanguageSelector';

export default function Navbar() {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTransporter = user?.role === 'transporter';
  const isAdmin = user?.role === 'admin';

  const profileLabel = t('nav.profile', 'Profile');

  const navItems = React.useMemo(() => {
    if (!isAuthenticated) {
      return [
        { href: '/#features', label: 'Features', icon: Calculator },
        { href: '/#workflow', label: 'How It Works', icon: Truck },
        { to: '/schemes-preview', label: 'Govt Schemes', icon: Landmark },
        { to: '/login', label: 'Live Mandis', icon: TrendingUp },
      ];
    }

    if (isAdmin) {
      return [
        { to: '/admin', label: 'APMC Admin Console', icon: Shield },
        { to: '/markets', label: 'Mandi Intelligence', icon: TrendingUp },
        { to: '/schemes', label: 'Govt Schemes', icon: Landmark },
        { to: '/profile', label: 'Profile', icon: User },
      ];
    }

    if (isTransporter) {
      return [
        { to: '/dashboard', label: 'Logistics Dashboard', icon: LayoutDashboard },
        { to: '/transport', label: 'Cargo Trips & Gate Pass', icon: Truck },
        { to: '/weather', label: 'Route Weather', icon: CloudSunRain },
        { to: '/profile', label: 'Profile', icon: User },
      ];
    }

    // Farmer
    return [
      { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
      { to: '/markets', label: t('nav.markets', 'Live Mandis'), icon: TrendingUp },
      { to: '/harvest', label: t('nav.harvest', 'Harvest Intelligence'), icon: Calculator },
      { to: '/schemes', label: t('nav.schemes', 'Govt Schemes'), icon: Landmark },
      { to: '/transport', label: t('nav.transport', 'Transport Pooling'), icon: Truck },
      { to: '/weather', label: t('nav.weather', 'Agri Weather'), icon: CloudSunRain },
      { to: '/chat', label: t('nav.chat', 'AI Advisory'), icon: Bot },
    ];
  }, [isAuthenticated, isAdmin, isTransporter, t]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-2 py-2">
          {/* Logo & Branding */}
          <Link 
            to="/" 
            id="brand-logo"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-tight tracking-tight text-text group-hover:text-primary transition-colors">
                Harvest<span className="text-primary">Mitra</span>
              </span>
              <span className="text-[10px] text-muted font-bold tracking-wide">
                Live Mandi & Logistics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on lg screens and up) */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-text hover:text-primary hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Mandi Gate Pass for Transporter */}
            {isTransporter && (
              <NavLink
                to="/transport?showpass=true"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition-all animate-pulse"
                title="Display Official APMC Digital Gate Pass to Security Inspector"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mandi Gate Pass</span>
                <span className="sm:hidden">Pass</span>
              </NavLink>
            )}

            {/* Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector id="header-language-selector" />
            </div>

            {/* Profile / Auth Status Indicator */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                {/* Real-time Session Pill */}
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-slate-50 text-text border-slate-200 hover:bg-slate-100'
                    }`
                  }
                  title={`Logged in as ${user?.name || 'User'} (${user?.role})`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>

                  <div className="flex items-center gap-1">
                    {isTransporter ? (
                      <Truck className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span className="max-w-[110px] truncate">{user?.name?.split(' ')[0] || 'User'}</span>
                    <span className="text-[10px] font-semibold text-muted px-1 py-0.5 rounded bg-white border border-slate-200 hidden sm:inline">
                      {isTransporter ? 'Transporter' : 'Farmer'}
                    </span>
                  </div>
                </NavLink>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out of active session"
                  className="p-2 rounded-xl text-muted hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <NavLink
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-text hover:text-primary hover:bg-slate-100 transition-colors"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="btn-primary px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
                >
                  Register
                </NavLink>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              id="mobile-nav-toggle"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden inline-flex items-center justify-center p-2 rounded-xl text-text hover:bg-slate-100 border border-border focus:outline-none"
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
          className="xl:hidden border-t border-border bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150"
        >
          <div className="text-[11px] font-extrabold uppercase text-muted tracking-wider px-3 py-1">
            Menu Navigation
          </div>
          <nav className="space-y-1" aria-label="Mobile navigation">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-text hover:bg-slate-100'
                }`
              }
            >
              <Sprout className="w-4 h-4" />
              <span>{t('nav.home', 'Home')}</span>
            </NavLink>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive ? 'bg-primary text-white' : 'text-text hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-text hover:bg-slate-100'
                }`
              }
            >
              <User className="w-4 h-4" />
              <span>{profileLabel}</span>
            </NavLink>
          </nav>

          <div className="pt-3 border-t border-border">
            <div className="text-[11px] font-extrabold uppercase text-muted tracking-wider px-3 mb-2">
              {t('common.selectLanguage', 'Select Language')}
            </div>
            <LanguageSelector variant="segmented" className="w-full justify-center" />
          </div>
        </div>
      )}
    </header>
  );
}
