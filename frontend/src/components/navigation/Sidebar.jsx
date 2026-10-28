import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronDown,
  LogOut,
  UserPlus,
  Landmark,
  Layers,
  Car,
  Navigation,
  Bell,
  IndianRupee,
  X,
  Sprout,
  Scale,
  Users,
  Store,
  ClipboardList,
  Compass,
  FileCheck2,
  CalendarCheck,
  Stethoscope,
  BookOpen,
  Globe2,
  Building2,
  LifeBuoy
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';

export default function Sidebar({ isOpen = false, onClose, className = '' }) {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  const isMandi = user?.role === 'mandi';
  const isAdmin = user?.role === 'admin';
  const isTransporter = user?.role === 'transporter';
  const isFpo = user?.role === 'fpo_leader' || user?.role === 'fpo';
  const isFarmer = !isMandi && !isAdmin && !isTransporter && !isFpo;

  const displayName = user?.name || (isAdmin ? 'Admin' : isMandi ? 'Mandi Official' : isTransporter ? 'Transporter' : isFpo ? 'FPO Leader' : 'Farmer');

  const userRoleSubtitle =
    isAdmin
      ? t('roles.adminSubtitle', 'APMC Regulatory Officer')
      : isMandi
      ? t('roles.mandiSubtitle', 'APMC Mandi Official')
      : isTransporter
      ? t('roles.transporterSubtitle', 'Transporter / Driver')
      : isFpo
      ? t('roles.fpoSubtitle', 'FPO Leader / Aggregator')
      : t('roles.farmerSubtitle', 'Farmer / Producer');

  const rolePillText =
    isAdmin
      ? t('roles.admin', 'Admin')
      : isMandi
      ? t('roles.mandi', 'Mandi Official')
      : isTransporter
      ? t('roles.transporter', 'Transporter')
      : isFpo
      ? t('roles.fpo', 'FPO Leader')
      : t('roles.farmer', 'Farmer');

  const profileLabel = t('nav.profile', 'My Profile');

  // Collapsible state for navigation sections
  const [openSections, setOpenSections] = useState({
    selling: true,
    logistics: true,
    farming: true,
    support: false,
    transporterOps: true,
    transporterFleet: true,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  // Farmer Grouped Navigation (PART 2.2)
  const farmerGroups = [
    {
      key: 'selling',
      label: t('nav.sellingGroup', 'SELLING'),
      icon: TrendingUp,
      items: [
        { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
        { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
        { to: '/markets?tab=explorer', label: t('nav.marketExplorer', 'Market Explorer'), icon: Compass },
        { to: '/harvest', label: t('nav.harvest', 'Harvest Simulator'), icon: Calculator },
        { to: '/dashboard#mandi-bookings', label: t('nav.mandiOffers', 'Mandi Offers'), icon: Store, badge: 'Direct' }
      ]
    },
    {
      key: 'logistics',
      label: t('nav.logisticsGroup', 'LOGISTICS'),
      icon: Truck,
      items: [
        { to: '/transport', label: t('nav.transport', 'Shared Transport'), icon: Layers, badge: 'Pool' },
        { to: '/transport?tab=farmer', label: t('nav.bookVehicles', 'Book Vehicles'), icon: Truck },
        { to: '/transport?tab=my-bookings', label: t('nav.myBookings', 'My Bookings'), icon: CalendarCheck },
        { to: '/transport?tab=tracking', label: t('nav.liveTracking', 'Live Tracking'), icon: Navigation },
        { to: '/transport?tab=gatepass', label: t('nav.gatePass', 'Cargo Trips & Gate Pass'), icon: Shield }
      ]
    },
    {
      key: 'farming',
      label: t('nav.farmingGroup', 'FARMING'),
      icon: Sprout,
      items: [
        { to: '/weather', label: t('nav.weather', 'Weather Alerts'), icon: CloudSunRain },
        { to: '/chat?mode=crop-doctor', label: t('nav.cropDoctor', 'Crop Doctor'), icon: Stethoscope, badge: 'AI' },
        { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'Copilot' },
        { to: '/chat?mode=guidance', label: t('nav.farmingGuidance', 'Farming Guidance'), icon: BookOpen }
      ]
    },
    {
      key: 'support',
      label: t('nav.supportGroup', 'SUPPORT'),
      icon: Landmark,
      items: [
        { to: '/schemes', label: t('nav.schemes', 'Govt Schemes'), icon: Landmark, badge: 'Gov' },
        { to: '/fpo', label: t('nav.fpoMembership', 'FPO Membership'), icon: Users },
        { to: '/chat?mode=support', label: t('nav.relevantSupport', 'Support Services'), icon: LifeBuoy }
      ]
    }
  ];

  // Transporter Grouped Navigation (PART 2.3)
  const transporterGroups = [
    {
      key: 'transporterOps',
      label: t('nav.logisticsGroup', 'OPERATIONS'),
      icon: Truck,
      items: [
        { to: '/dashboard', label: t('nav.logisticsDashboard', 'Logistics Dashboard'), icon: LayoutDashboard },
        { to: '/transport?tab=requests', label: t('nav.incomingRequests', 'Incoming Requests'), icon: Truck, badge: 'Live' },
        { to: '/transport?tab=fleet', label: t('nav.fleetManagement', 'Fleet & Vehicle Management'), icon: Car },
        { to: '/transport?tab=shared', label: t('nav.sharedTrips', 'Shared Trips & Groups'), icon: Layers, badge: 'Pool' },
        { to: '/transport?tab=active', label: t('nav.activeTrips', 'My Active Trips'), icon: Navigation },
        { to: '/transport?tab=gatepass', label: t('nav.cargoGatePass', 'Cargo Trips & Gate Pass'), icon: Shield },
        { to: '/transport?tab=history', label: t('nav.tripHistory', 'Trip History & Earnings'), icon: IndianRupee }
      ]
    },
    {
      key: 'support',
      label: t('nav.supportGroup', 'SUPPORT & AI'),
      icon: Landmark,
      items: [
        { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
        { to: '/weather', label: t('nav.routeWeather', 'Route Weather Alerts'), icon: CloudSunRain },
        { to: '/transport?tab=notifications', label: t('nav.notifications', 'Route Alerts & Messages'), icon: Bell },
        { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' }
      ]
    }
  ];

  // FPO Navigation
  const fpoItems = [
    { to: '/fpo/dashboard', label: t('nav.fpoDashboard', 'FPO Dashboard'), icon: LayoutDashboard },
    { to: '/fpo/members', label: t('nav.memberRoster', 'Member Roster'), icon: Users, badge: 'Team' },
    { to: '/fpo/crops', label: t('nav.cropAvailability', 'Crop Availability'), icon: Sprout },
    { to: '/fpo/aggregation', label: t('nav.collectiveLots', 'Collective Lots'), icon: Layers, badge: 'Pool' },
    { to: '/fpo/procurement', label: t('nav.bulkProcurement', 'Bulk Mandi Offers'), icon: Store },
    { to: '/fpo/transport', label: t('nav.transportDispatch', 'Transport Dispatch'), icon: Truck },
    { to: '/fpo/orders', label: t('nav.ordersHistory', 'Orders & History'), icon: ClipboardList },
    { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' }
  ];

  // Mandi Navigation
  const mandiItems = [
    { to: '/dashboard', label: t('nav.mandiDashboard', 'Mandi Dashboard'), icon: LayoutDashboard },
    { to: '/dashboard?tab=listings', label: t('nav.incomingListings', 'Incoming Crop Listings'), icon: Sprout },
    { to: '/dashboard?tab=bookings', label: t('nav.procurementBookings', 'Procurement & Bookings'), icon: Scale },
    { to: '/markets', label: t('nav.liveApmcRates', 'Live APMC Rates'), icon: TrendingUp },
    { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' }
  ];

  // Admin Navigation
  const adminItems = [
    { to: '/admin', label: t('nav.adminControlCenter', 'Admin Control Center'), icon: Shield, badge: 'Gov' },
    { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
    { to: '/schemes', label: t('nav.schemes', 'Govt Schemes'), icon: Landmark, badge: 'New' },
    { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' }
  ];

  const isItemActive = (to) => {
    const [path, search] = to.split('?');
    if (search) {
      return location.pathname === path && location.search.includes(search);
    }
    return location.pathname === path && !location.search;
  };

  const renderSidebarContent = (isMobileDrawer = false) => (
    <div className="flex flex-col justify-between min-h-full space-y-4 pb-2 overscroll-contain touch-pan-y">
      <div className="space-y-3.5">
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
        <div className={`py-2.5 px-3 rounded-2xl ${isMandi ? 'bg-gradient-to-br from-orange-50/90 to-amber-50/50 border-orange-200/90' : 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-200/80'} border flex items-center gap-3 shadow-2xs`}>
          <div className={`w-9 h-9 rounded-xl ${isMandi ? 'bg-orange-600 text-white' : 'bg-primary text-white'} flex items-center justify-center font-bold text-base shadow-xs shrink-0`}>
            {isTransporter ? '🚚' : isAdmin ? '🛡️' : isMandi ? '🏪' : '🌾'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900 truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isMandi ? 'bg-orange-50 border border-orange-300 text-orange-900' : 'bg-white border border-emerald-300 text-emerald-800'} shadow-2xs`}>
                {rolePillText}
              </span>
              <span className="text-[10px] text-muted truncate">{isMandi ? (user?.MandiProfile?.mandiName || 'Pune APMC') : 'Maharashtra'}</span>
            </div>
          </div>
        </div>

        {/* Primary Dashboard Link for Farmers */}
        {isFarmer && (
          <div className="pt-0.5">
            <NavLink
              to="/dashboard"
              onClick={handleLinkClick}
              className={() => {
                const active = location.pathname === '/dashboard';
                return `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                  active
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text hover:bg-slate-100 hover:text-slate-900'
                }`;
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t('nav.dashboard', 'Overview Dashboard')}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          </div>
        )}

        {/* Grouped Navigation Sections */}
        {isFarmer && (
          <div className="space-y-2 pt-1">
            {farmerGroups.map((grp) => {
              const isExpanded = openSections[grp.key] ?? true;
              return (
                <div key={grp.key} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleSection(grp.key)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-muted hover:text-text transition-colors"
                  >
                    <span>{grp.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-muted" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted" />
                    )}
                  </button>

                  {isExpanded && (
                    <nav className="space-y-0.5 pl-1" aria-label={grp.label}>
                      {grp.items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item.to);
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleLinkClick}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                              active
                                ? 'bg-primary text-white font-bold shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.badge && (
                                <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md ${
                                  active 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </NavLink>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Transporter Grouped Navigation */}
        {isTransporter && (
          <div className="space-y-2 pt-1">
            {transporterGroups.map((grp) => {
              const isExpanded = openSections[grp.key] ?? true;
              return (
                <div key={grp.key} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleSection(grp.key)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-muted hover:text-text transition-colors"
                  >
                    <span>{grp.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-muted" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted" />
                    )}
                  </button>

                  {isExpanded && (
                    <nav className="space-y-0.5 pl-1" aria-label={grp.label}>
                      {grp.items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item.to);
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleLinkClick}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                              active
                                ? 'bg-primary text-white font-bold shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.badge && (
                                <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md ${
                                  active 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </NavLink>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* FPO, Mandi, Admin Flat Lists */}
        {(isAdmin || isMandi || isFpo) && (
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-muted">
              {t('nav.mainMenu', 'Main Menu')}
            </div>
            <nav className="space-y-1 pt-0.5" aria-label="Role specific navigation">
              {(isAdmin ? adminItems : isMandi ? mandiItems : fpoItems).map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                      active
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-text hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9.5px] font-extrabold rounded-md bg-accent/20 text-accent group-hover:bg-accent group-hover:text-black transition-colors">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Account & Profile Section (PART 2.2 ACCOUNT Group) */}
        <div className="space-y-1 pt-2 border-t border-border/80">
          <div className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-muted">
            {t('nav.accountGroup', 'ACCOUNT')}
          </div>
          <nav className="space-y-1 pt-0.5" aria-label="Sidebar account navigation">
            <ThemeToggle variant="sidebar" />
            <NavLink
              to="/profile"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-text hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{profileLabel}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            {isAuthenticated ? (
              <button
                type="button"
                id="sidebar-sign-out-btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (onClose) onClose();
                  logout();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t('nav.signOut', 'Sign Out')}</span>
                </div>
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={handleLinkClick}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t('nav.farmerLogin', 'Farmer Login')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={handleLinkClick}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t('nav.createAccount', 'Create Account')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* HarvestMitra Version & Security Seal */}
      <div className="pt-3 border-t border-border/80">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span className="text-[11px] font-bold text-slate-800">HarvestMitra Core & Suite</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-primary">
            v2.5
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (Always visible on lg screens and up, width w-72 for readable typography) */}
      <aside 
        id="dashboard-sidebar-desktop"
        className={`hidden lg:flex w-72 shrink-0 self-start ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-surface border-border'} border-r h-[calc(100vh-4rem)] flex-col sticky top-16 z-20 overflow-y-auto overflow-x-hidden min-h-0 p-4 sidebar-scroll overscroll-contain touch-pan-y ${className}`}
        aria-label="Dashboard desktop sidebar navigation"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Responsive Mobile / Tablet Off-Canvas Drawer (< lg) */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          <aside 
            id="dashboard-sidebar-mobile"
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] ${isDark ? 'bg-slate-900 text-white' : 'bg-white'} shadow-2xl flex flex-col p-4 overflow-y-auto overflow-x-hidden min-h-0 sidebar-scroll overscroll-contain touch-pan-y lg:hidden animate-in slide-in-from-left duration-200`}
            aria-label="Dashboard mobile sidebar drawer"
          >
            {renderSidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
}
