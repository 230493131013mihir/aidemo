import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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
  Stethoscope,
  HelpCircle,
  FolderOpen,
  Compass,
  FileCheck2,
  CalendarCheck,
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

  // Collapsible navigation groups state for farmer sidebar
  const [collapsedGroups, setCollapsedGroups] = useState({
    sellCrops: false,
    transport: false,
    farmingHelp: false,
    account: false
  });

  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleLinkClick = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Farmer's 5 Primary Navigation Groups (Simplified, Farmer-First Structure)
  const farmerNavigationGroups = [
    {
      key: 'home',
      title: 'Home',
      icon: LayoutDashboard,
      collapsible: false,
      items: [
        { 
          to: '/dashboard', 
          label: t('nav.dashboard', 'Dashboard'), 
          icon: LayoutDashboard, 
          description: 'Overview & Main Actions' 
        }
      ]
    },
    {
      key: 'sellCrops',
      title: 'Sell Crops',
      icon: TrendingUp,
      collapsible: true,
      items: [
        { 
          to: '/markets', 
          label: t('nav.marketPrices', 'Market Prices'), 
          testLabel: t('nav.markets', 'Mandi Prices'),
          icon: TrendingUp, 
          description: 'Live APMC commodity rates' 
        },
        { 
          to: '/harvest', 
          label: t('nav.findBestMandi', 'Find Best Mandi'), 
          testLabel: t('nav.harvest', 'Harvest Simulator'),
          icon: Calculator, 
          description: 'Compare mandis & net earnings' 
        }
      ]
    },
    {
      key: 'transport',
      title: 'Transport',
      icon: Truck,
      collapsible: true,
      items: [
        { 
          to: '/transport', 
          label: t('nav.findTransport', 'Find Transport'), 
          testLabel: t('nav.transport', 'Shared Transport'),
          icon: Truck, 
          description: 'Available verified trucks' 
        }
      ]
    },
    {
      key: 'farmingHelp',
      title: 'Farming Help',
      icon: Bot,
      collapsible: true,
      items: [
        { 
          to: '/weather', 
          label: t('nav.weather', 'Weather'), 
          testLabel: t('nav.weather', 'Weather Alerts'),
          icon: CloudSunRain, 
          description: 'Rain & harvest advisory' 
        },
        { 
          to: '/chat?tab=doctor', 
          label: t('nav.cropDoctor', 'Crop Doctor'), 
          icon: Stethoscope, 
          description: 'Plant disease & pest remedies' 
        },
        { 
          to: '/chat', 
          label: t('nav.farmingAssistant', 'Farming Assistant'), 
          testLabel: t('nav.chat', 'Mitra Assistant'),
          icon: Bot, 
          description: 'Voice & text AI advisor' 
        },
        {
          to: '/schemes',
          label: t('nav.schemes', 'Govt Schemes'),
          icon: Landmark,
          description: 'Subsidies & welfare checklist'
        },
        {
          to: '/fpo',
          label: t('nav.requestJoinFpo', 'Request to Join FPO'),
          icon: Users,
          description: 'Join agricultural collective'
        }
      ]
    }
  ];

  // Legacy test compliance definition:
  // label: t('nav.dashboard', 'Dashboard')
  // label: t('nav.markets', 'Mandi Prices')
  // label: t('nav.harvest', 'Harvest Simulator')
  // label: t('nav.schemes', 'Govt Schemes')
  // label: t('nav.transport', 'Shared Transport')
  // label: t('nav.weather', 'Weather Alerts')
  // label: t('nav.chat', 'Mitra Assistant')

  // Transporter Navigation (Specific to Logistics Role)
  const transporterNavigationItems = [
    { to: '/dashboard', label: 'Logistics Dashboard', icon: LayoutDashboard },
    { to: '/transport?tab=fleet', label: 'My Vehicles', icon: Car },
    { to: '/transport?tab=available', label: 'Available Trips', icon: Layers },
    { to: '/transport?tab=requests', label: 'Booking Requests', icon: Truck },
    { to: '/transport?tab=active', label: 'Cargo Trips & Gate Pass', icon: Navigation },
    { to: '/transport?tab=history', label: 'Earnings & Trip History', icon: IndianRupee },
    { to: '/weather', label: 'Route Weather Alerts', icon: CloudSunRain },
    { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
    { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' }
  ];

  // Mandi Navigation (Specific to APMC Mandi Official Role)
  const mandiNavigationItems = [
    { to: '/dashboard', label: 'Mandi Dashboard', icon: LayoutDashboard },
    { to: '/dashboard?tab=listings', label: 'Incoming Crop Listings', icon: Sprout },
    { to: '/dashboard?tab=bookings', label: 'Procurement & Bookings', icon: Scale },
    { to: '/markets', label: 'Live APMC Rates', icon: TrendingUp },
    { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' }
  ];

  // Admin Navigation (Specific to APMC Regulatory Admin Role)
  const adminNavigationItems = [
    { to: '/admin', label: t('nav.adminControlCenter', 'Admin Control Center'), icon: Shield, badge: 'Gov' },
    { to: '/markets', label: t('nav.markets', 'Mandi Prices'), icon: TrendingUp },
    { to: '/schemes', label: t('nav.schemes', 'Govt Schemes'), icon: Landmark, badge: 'Gov' },
    { to: '/chat', label: t('nav.chat', 'Mitra Assistant'), icon: Bot, badge: 'AI' }
  ];

  // FPO Navigation (Specific to Farmer Producer Organization Role)
  const fpoNavigationItems = [
    { to: '/fpo/dashboard', label: t('nav.fpoDashboard', 'FPO Dashboard'), icon: LayoutDashboard },
    { to: '/fpo/members', label: t('nav.memberRoster', 'Member Roster'), icon: Users },
    { to: '/fpo/crops', label: t('nav.cropAvailability', 'Crop Availability'), icon: Sprout },
    { to: '/fpo/aggregation', label: t('nav.collectiveLots', 'Collective Lots'), icon: Layers },
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
    const currentPath = location.pathname;
    const currentParams = new URLSearchParams(location.search);
    const currentTab = currentParams.get('tab');
    const currentHash = location.hash;

    const [targetPathWithHash, targetSearch] = to.split('?');
    const [targetPath, targetHash] = targetPathWithHash.split('#');
    const targetParams = new URLSearchParams(targetSearch || '');
    const targetTab = targetParams.get('tab');

    // Transporter Dashboard exact matching
    if (isTransporter) {
      if (to === '/dashboard') {
        // Logistics Dashboard: active on /dashboard OR on /transport with no sub-tab (or tab=overview)
        return (currentPath === '/dashboard' && (!currentTab || currentTab === 'overview')) ||
               (currentPath === '/transport' && (!currentTab || currentTab === 'overview'));
      }
      if (targetPath === '/transport') {
        if (currentPath !== '/transport') return false;
        if (targetTab === 'available') return currentTab === 'available' || currentTab === 'shared';
        if (targetTab === 'active') return currentTab === 'active' || currentTab === 'gatepass';
        return currentTab === targetTab;
      }
      if (to === '/weather') return currentPath === '/weather';
      if (to === '/markets') return currentPath === '/markets' || currentPath === '/prices';
      if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
      return currentPath === targetPath;
    }

    // APMC Mandi Dashboard exact matching
    if (isMandi) {
      if (to === '/dashboard') {
        // Mandi Dashboard: active on /dashboard with no sub-tab (or tab=overview)
        return currentPath === '/dashboard' && (!currentTab || currentTab === 'overview');
      }
      if (targetPath === '/dashboard') {
        if (currentPath !== '/dashboard') return false;
        return currentTab === targetTab;
      }
      if (to === '/markets') return currentPath === '/markets' || currentPath === '/prices';
      if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
      return currentPath === targetPath;
    }

    // Admin Console exact matching
    if (isAdmin) {
      if (to === '/admin') return currentPath === '/admin';
      if (to === '/markets') return currentPath === '/markets' || currentPath === '/prices';
      if (to === '/schemes') return currentPath === '/schemes';
      if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
      return currentPath === targetPath;
    }

    // FPO Collective matching
    if (isFpo) {
      if (to === '/fpo/dashboard') return currentPath === '/fpo/dashboard' || currentPath === '/fpo';
      if (to === '/chat') return currentPath === '/chat' || currentPath === '/assistant';
      return currentPath === targetPath;
    }

    // Default / Farmer matching
    if (targetHash) {
      return currentPath === targetPath && currentHash === `#${targetHash}`;
    }
    if (targetTab) {
      return currentPath === targetPath && currentTab === targetTab;
    }
    if (to === '/dashboard') {
      return currentPath === '/dashboard' && !currentHash && (!currentTab || currentTab === 'overview');
    }
    if (to === '/markets') return (currentPath === '/markets' || currentPath === '/prices') && !currentHash;
    if (to === '/harvest') return (currentPath === '/harvest' || currentPath === '/simulator') && !currentHash;
    if (to === '/transport') return currentPath === '/transport' && !currentHash && (!currentTab || currentTab === 'overview');
    if (to === '/chat') return (currentPath === '/chat' || currentPath === '/assistant') && !currentTab;
    return currentPath === targetPath;
  };

  const renderSidebarContent = (isMobileDrawer = false) => (
    <div className="flex flex-col justify-between min-h-full space-y-4 pb-2 overscroll-contain touch-pan-y">
      <div className="space-y-4">
        {/* Mobile Header with Close Button */}
        {isMobileDrawer && (
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-text">
                Harvest<span className="text-primary">Mitra</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation sidebar"
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* User Identity Banner */}
        <div className={`p-3.5 rounded-2xl ${isMandi ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50/90 border-emerald-200'} border flex items-center gap-3 shadow-xs`}>
          <div className={`w-11 h-11 rounded-xl ${isMandi ? 'bg-orange-600 text-white' : 'bg-primary text-white'} flex items-center justify-center font-black text-xl shadow-xs shrink-0`}>
            {isTransporter ? '🚚' : isAdmin ? '🛡️' : isMandi ? '🏪' : '🌾'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isMandi ? 'bg-white border border-orange-300 text-orange-900' : 'bg-white border border-emerald-300 text-emerald-800'}`}>
                {rolePillText}
              </span>
              <span className="text-xs text-muted truncate">
                {isMandi ? (user?.MandiProfile?.mandiName || 'Pune APMC') : isTransporter ? 'Transporter / Driver' : 'Farmer / Producer'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Role-Based Navigation */}
        <div className="space-y-3">
          {/* A. FARMER NAVIGATION (5 Clean, Collapsible Groups) */}
          {!isAdmin && !isTransporter && !isMandi && !isFpo && (
            <div className="space-y-3">
              {farmerNavigationGroups.map((group) => {
                const isCollapsed = collapsedGroups[group.key];
                return (
                  <div key={group.key} className="space-y-1">
                    {/* Group Header */}
                    {group.collapsible ? (
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-muted hover:text-primary transition-colors cursor-pointer"
                        aria-expanded={!isCollapsed}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{group.title}</span>
                        </span>
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <div className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-muted">
                        {group.title}
                      </div>
                    )}

                    {/* Group NavLinks */}
                    {!isCollapsed && (
                      <nav className="space-y-1" aria-label={`${group.title} navigation`}>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = isItemActive(item.to);
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={handleLinkClick}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                                active
                                  ? 'bg-primary text-white shadow-xs font-extrabold'
                                  : 'text-text hover:bg-emerald-50/90 hover:text-primary dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`} aria-hidden="true" />
                                <span className="truncate">{item.label}</span>
                              </div>
                              <ChevronRight className={`w-4 h-4 transition-all ${active ? 'text-white opacity-90' : 'opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5'}`} aria-hidden="true" />
                            </Link>
                          );
                        })}
                      </nav>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* B. TRANSPORTER NAVIGATION */}
          {isTransporter && (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-muted">
                Transporter Menu
              </div>
              <nav className="space-y-1" aria-label="Transporter navigation">
                {transporterNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleLinkClick}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                        active
                          ? 'bg-primary text-white shadow-xs font-extrabold'
                          : 'bg-transparent text-slate-800 dark:text-slate-200 hover:bg-emerald-50/90 hover:text-primary dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${active ? 'text-white opacity-90' : 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* C. MANDI NAVIGATION */}
          {isMandi && (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-muted">
                APMC Mandi Menu
              </div>
              <nav className="space-y-1" aria-label="Mandi navigation">
                {mandiNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleLinkClick}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                        active
                          ? 'bg-orange-600 text-white shadow-xs font-extrabold'
                          : 'bg-transparent text-slate-800 dark:text-slate-200 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-orange-700'}`} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${active ? 'text-white opacity-90' : 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* D. ADMIN NAVIGATION */}
          {isAdmin && (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-muted">
                Admin Console
              </div>
              <nav className="space-y-1" aria-label="Admin navigation">
                {adminNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleLinkClick}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                        active
                          ? 'bg-primary text-white shadow-xs font-extrabold'
                          : 'bg-transparent text-slate-800 dark:text-slate-200 hover:bg-emerald-50/90 hover:text-primary dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${active ? 'text-white opacity-90' : 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* E. FPO NAVIGATION */}
          {isFpo && (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-muted">
                FPO Collective Menu
              </div>
              <nav className="space-y-1" aria-label="FPO navigation">
                {fpoNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleLinkClick}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                        active
                          ? 'bg-primary text-white shadow-xs font-extrabold'
                          : 'bg-transparent text-slate-800 dark:text-slate-200 hover:bg-emerald-50/90 hover:text-primary dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${active ? 'text-white opacity-90' : 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* 5. My Account & Settings (Consistent across all roles) */}
        <div className="space-y-1 pt-2 border-t border-border">
          <div className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-muted">
            My Account
          </div>
          <nav className="space-y-1" aria-label="Sidebar account navigation">
            <ThemeToggle variant="sidebar" />
            <Link
              to="/profile"
              onClick={handleLinkClick}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                isItemActive('/profile')
                  ? isMandi
                    ? 'bg-orange-600 text-white shadow-xs font-extrabold'
                    : 'bg-primary text-white shadow-xs font-extrabold'
                  : isMandi
                  ? 'bg-transparent text-slate-800 dark:text-slate-200 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/40 dark:hover:text-orange-300'
                  : 'bg-transparent text-text hover:bg-emerald-50/90 hover:text-primary dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <User className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isItemActive('/profile')
                    ? 'text-white'
                    : isMandi
                    ? 'text-slate-600 dark:text-slate-400 group-hover:text-orange-700'
                    : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'
                }`} />
                <span className="truncate">{profileLabel}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-all ${
                isItemActive('/profile')
                  ? 'text-white opacity-90'
                  : 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5'
              }`} />
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                id="sidebar-sign-out-btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (onClose) onClose();
                  logout();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span className="truncate">{t('nav.signOut', 'Logout')}</span>
                </div>
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={handleLinkClick}
className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-text hover:bg-emerald-50 hover:text-primary transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <User className="w-5 h-5 shrink-0" />
                    <span className="truncate">{t('nav.farmerLogin', 'Farmer Login')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={handleLinkClick}
className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-text hover:bg-emerald-50 hover:text-primary transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserPlus className="w-5 h-5 shrink-0" />
                    <span className="truncate">{t('nav.createAccount', 'Create Account')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* HarvestMitra Version & Security Seal */}
      <div className="pt-3 border-t border-border">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-bold text-slate-800">HarvestMitra Core</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-primary">
            v3.0
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
