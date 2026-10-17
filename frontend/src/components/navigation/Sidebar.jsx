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
  Landmark
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ className = '' }) {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  const displayName = user?.name || 'Farmer';
  const roleName =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'transporter'
      ? 'Transporter / Driver'
      : 'Farmer / Producer';

  const isAdmin = user?.role === 'admin';
  const isTransporter = user?.role === 'transporter';

  const profileLabel = t('nav.profile', 'Profile');

  const navigationSections = React.useMemo(() => {
    if (isAdmin) {
      return [
        {
          title: 'APMC Governance',
          items: [
            { to: '/admin', label: 'Admin Control Center', icon: Shield },
            { to: '/schemes', label: 'Govt Schemes Directory', icon: Landmark, badge: 'Gov' },
            { to: '/markets', label: 'Mandi Rates & Mandis', icon: TrendingUp },
          ]
        }
      ];
    }

    if (isTransporter) {
      return [
        {
          title: 'Fleet & Logistics',
          items: [
            { to: '/dashboard', label: 'Logistics Dashboard', icon: LayoutDashboard },
            { to: '/transport', label: 'Cargo Trips & Gate Pass', icon: Truck },
            { to: '/weather', label: 'Route Weather Alerts', icon: CloudSunRain },
          ]
        }
      ];
    }

    // Farmer
    return [
      {
        title: 'Analytics & Planning',
        items: [
          { to: '/dashboard', label: t('nav.dashboard', 'Farmer Dashboard'), icon: LayoutDashboard },
          { to: '/markets', label: t('nav.markets', 'Live Mandis'), icon: TrendingUp },
          { to: '/harvest', label: t('nav.harvest', 'Harvest Simulator'), icon: Calculator },
        ]
      },
      {
        title: 'Government & Advisory',
        items: [
          { to: '/schemes', label: t('nav.schemes', 'Govt Schemes'), icon: Landmark, badge: 'New' },
          { to: '/chat', label: t('nav.chat', 'Mitra AI Advisory'), icon: Bot, badge: 'AI' },
        ]
      },
      {
        title: 'Operations & Logistics',
        items: [
          { to: '/transport', label: t('nav.transport', 'Shared Transport'), icon: Truck },
          { to: '/weather', label: t('nav.weather', 'Agri Weather'), icon: CloudSunRain },
        ]
      },
    ];
  }, [isAdmin, isTransporter, t]);

  return (
    <aside 
      className={`w-64 shrink-0 bg-surface border-r border-border flex flex-col justify-between p-4 ${className}`}
      aria-label="Dashboard sidebar navigation"
    >
      <div className="space-y-6">
        {/* Role-Aware User Status Pill */}
        <div className="p-3 rounded-xl bg-secondary/80 border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {isTransporter ? '🚚' : isAdmin ? '🛡️' : '🌾'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-muted truncate">
              {roleName}
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

        {/* Dynamic Account Section */}
        <div className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted/80">
            Account
          </div>
          <nav className="space-y-1">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-text hover:bg-secondary hover:text-primary'
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
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-primary text-white shadow-xs font-semibold'
                      : 'text-text hover:bg-secondary hover:text-primary'
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
                onClick={logout}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors group"
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
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-text hover:bg-secondary hover:text-primary transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="truncate">Farmer Login</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
                <NavLink
                  to="/register"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-text hover:bg-secondary hover:text-primary transition-all"
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

      {/* Version & Status */}
      <div className="pt-4 border-t border-border">
        <div className="p-3 rounded-xl bg-primary-50 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold text-primary-dark">HarvestMitra Core</span>
          </div>
          <span className="badge-tag bg-white text-primary border border-primary/20">
            v2.4
          </span>
        </div>
      </div>
    </aside>
  );
}
