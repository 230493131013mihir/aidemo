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
  Shield, 
  Sparkles, 
  ChevronRight,
  LogOut,
  UserPlus,
  Landmark,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';

export default function Sidebar({ isOpen = false, onClose, className = '' }) {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark } = useTheme();

  const displayName = user?.name || 'Prashant Warule';
  const roleName =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'transporter'
      ? 'Transporter / Driver'
      : 'Farmer / Producer';

  const rolePillText =
    user?.role === 'admin'
      ? 'Admin'
      : user?.role === 'transporter'
      ? 'Transporter'
      : 'Farmer';

  const isAdmin = user?.role === 'admin';
  const isTransporter = user?.role === 'transporter';

  const profileLabel = t('nav.profile', 'My Profile');

  // Exact vertical navigation options according to specifications
  const navigationItems = React.useMemo(() => {
    if (isAdmin) {
      return [
        { to: '/admin', label: 'Admin Control Center', icon: Shield, badge: 'Gov' },
        { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
        { to: '/schemes', label: t('nav.schemes', 'Govt Schemes'), icon: Landmark, badge: 'New' },
        { to: '/harvest', label: t('nav.harvest', 'Harvest Simulator'), icon: Calculator },
        { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' },
      ];
    }

    if (isTransporter) {
      return [
        { to: '/dashboard', label: 'Logistics Dashboard', icon: LayoutDashboard },
        { to: '/transport', label: 'Cargo Trips & Gate Pass', icon: Truck },
        { to: '/weather', label: 'Route Weather Alerts', icon: CloudSunRain },
        { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
        { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' },
      ];
    }

    // Farmer (Primary role):
    // 1. Dashboard
    // 2. Mandi Prices
    // 3. Harvest Simulator
    // 4. Govt Schemes
    // 5. Shared Transport
    // 6. Weather Alerts
    // 7. Mitra Assistant
    return [
      { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
      { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
      { to: '/harvest', label: t('nav.harvest', 'Harvest Simulator'), icon: Calculator },
      { to: '/schemes', label: t('nav.schemes', 'Govt Schemes'), icon: Landmark, badge: 'Gov' },
      { to: '/transport', label: t('nav.transport', 'Shared Transport'), icon: Truck },
      { to: '/weather', label: t('nav.weather', 'Weather Alerts'), icon: CloudSunRain },
      { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' },
    ];
  }, [isAdmin, isTransporter, t]);

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const renderSidebarContent = (isMobileDrawer = false) => (
    <div className="flex flex-col justify-between min-h-full space-y-6 pb-2">
      <div className="space-y-5">
        {/* Mobile Header with Close Button */}
        {isMobileDrawer && (
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-text">
                Harvest<span className="text-primary">Mitra</span> Navigation
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation sidebar"
              className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* User Status Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            {isTransporter ? '🚚' : isAdmin ? '🛡️' : '🌾'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900 truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 shadow-2xs">
                {rolePillText}
              </span>
              <span className="text-[10px] text-muted truncate">Maharashtra</span>
            </div>
          </div>
        </div>

        {/* Main Vertical Navigation */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Main Menu
          </div>
          <nav className="space-y-1.5 pt-1" aria-label="Sidebar main navigation">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'text-text hover:bg-emerald-50/90 hover:text-primary'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-accent/20 text-accent group-hover:bg-accent group-hover:text-black transition-colors">
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

        {/* Account & Profile Section */}
        <div className="space-y-1 pt-2 border-t border-border/80">
          <div className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Account Settings
          </div>
          <nav className="space-y-1 pt-1" aria-label="Sidebar account navigation">
            {/* Dark/Light Mode Toggle */}
            <ThemeToggle variant="sidebar" />
            <NavLink
              to="/profile"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-text hover:bg-emerald-50/90 hover:text-primary'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{profileLabel}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
            </NavLink>

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary text-white shadow-xs font-bold'
                      : 'text-text hover:bg-emerald-50/90 hover:text-primary'
                  }`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="truncate">Admin Panel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
              </NavLink>
            )}

            {isAuthenticated ? (
              <button
                type="button"
                id="sidebar-sign-out-btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (onClose) onClose();
                  logout();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="truncate">Sign Out</span>
                </div>
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={handleLinkClick}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-text hover:bg-emerald-50 hover:text-primary transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="truncate">Farmer Login</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={handleLinkClick}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-text hover:bg-emerald-50 hover:text-primary transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span className="truncate">Create Account</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Theme Switcher Toggle (Issue #141) */}
      <div className="pt-2">
        <ThemeToggle variant="full" />
      </div>

      {/* HarvestMitra Version & Security Seal */}
      <div className="pt-3 border-t border-border/80">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span className="text-[11px] font-bold text-slate-800">HarvestMitra Core</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-primary">
            v2.4
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (Always visible on lg screens and up) */}
      <aside 
        id="dashboard-sidebar-desktop"
        className={`hidden lg:flex w-64 shrink-0 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-surface border-border'} border-r h-[calc(100vh-4rem)] flex-col sticky top-16 z-20 overflow-y-auto overflow-x-hidden min-h-0 p-4 sidebar-scroll ${className}`}
        aria-label="Dashboard desktop sidebar navigation"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Responsive Mobile / Tablet Off-Canvas Drawer (< lg) */}
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Off-canvas Sliding Drawer */}
          <aside 
            id="dashboard-sidebar-mobile"
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] ${isDark ? 'bg-slate-900 text-white' : 'bg-white'} shadow-2xl flex flex-col p-4 overflow-y-auto overflow-x-hidden min-h-0 sidebar-scroll lg:hidden animate-in slide-in-from-left duration-200`}
            aria-label="Dashboard mobile sidebar drawer"
          >
            {renderSidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
}
