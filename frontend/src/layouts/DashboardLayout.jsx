import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import KisanFloatingBar from '../components/common/KisanFloatingBar';
import NetworkStatusBadge from '../components/common/NetworkStatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Truck, Building2, Users, Bot, CloudSunRain, Compass } from 'lucide-react';

function getModuleTheme(pathname, userRole) {
  if (pathname.startsWith('/admin')) {
    return {
      id: 'admin',
      bgImage: null, // Technical operations console: clean slate with microgrid, no distracting photos
      lightOverlay: 'rgba(248, 250, 248, 0.98)',
      darkOverlay: 'rgba(15, 23, 42, 0.98)',
      accentGlow1: 'bg-indigo-900/10',
      accentGlow2: 'bg-slate-900/10',
      badgeText: 'Admin Operations Console',
      badgeIcon: Shield,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
  }
  if (pathname.startsWith('/transporter') || pathname.startsWith('/transport') || userRole === 'transporter') {
    return {
      id: 'transporter',
      bgImage: '/images/transport-hero.jpg',
      lightOverlay: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.91), rgba(241, 245, 249, 0.95))',
      darkOverlay: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.93), rgba(15, 23, 42, 0.97))',
      accentGlow1: 'bg-amber-600/10',
      accentGlow2: 'bg-blue-600/10',
      badgeText: 'Logistics & Shared Fleet',
      badgeIcon: Truck,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      lightOpacity: 0.16,
      darkOpacity: 0.09
    };
  }
  if (pathname.startsWith('/mandi') || userRole === 'mandi') {
    return {
      id: 'mandi',
      bgImage: '/images/mandi-hero.jpg',
      lightOverlay: 'linear-gradient(to bottom, rgba(254, 252, 248, 0.91), rgba(250, 248, 242, 0.95))',
      darkOverlay: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.93), rgba(15, 23, 42, 0.97))',
      accentGlow1: 'bg-amber-600/10',
      accentGlow2: 'bg-emerald-600/10',
      badgeText: 'APMC Wholesale Mandi',
      badgeIcon: Building2,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      lightOpacity: 0.18,
      darkOpacity: 0.10
    };
  }
  if (pathname.startsWith('/fpo') || userRole === 'fpo') {
    return {
      id: 'fpo',
      bgImage: '/images/harvest-hero.jpg',
      lightOverlay: 'linear-gradient(to bottom, rgba(248, 252, 250, 0.91), rgba(243, 248, 245, 0.95))',
      darkOverlay: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.93), rgba(15, 23, 42, 0.97))',
      accentGlow1: 'bg-emerald-600/10',
      accentGlow2: 'bg-purple-600/10',
      badgeText: 'FPO Collective Power',
      badgeIcon: Users,
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      lightOpacity: 0.17,
      darkOpacity: 0.10
    };
  }
  if (pathname.startsWith('/chat')) {
    return {
      id: 'chat',
      bgImage: '/images/dashboard-hero.jpg',
      lightOverlay: 'linear-gradient(to bottom, rgba(250, 252, 251, 0.93), rgba(244, 248, 246, 0.96))',
      darkOverlay: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.98))',
      accentGlow1: 'bg-purple-600/10',
      accentGlow2: 'bg-emerald-500/10',
      badgeText: 'Mitra AI Assistant',
      badgeIcon: Bot,
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      lightOpacity: 0.14,
      darkOpacity: 0.08
    };
  }
  if (pathname.startsWith('/weather')) {
    return {
      id: 'weather',
      bgImage: '/images/weather-hero.jpg',
      lightOverlay: 'linear-gradient(to bottom, rgba(248, 251, 254, 0.91), rgba(242, 247, 252, 0.95))',
      darkOverlay: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.93), rgba(15, 23, 42, 0.97))',
      accentGlow1: 'bg-sky-500/10',
      accentGlow2: 'bg-emerald-600/10',
      badgeText: 'Weather Intelligence',
      badgeIcon: CloudSunRain,
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      lightOpacity: 0.18,
      darkOpacity: 0.10
    };
  }
  // Default: Farmer Suite
  return {
    id: 'farmer',
    bgImage: '/images/harvest-hero.jpg',
    lightOverlay: 'linear-gradient(to bottom, rgba(251, 252, 249, 0.91), rgba(245, 248, 244, 0.95))',
    darkOverlay: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.93), rgba(15, 23, 42, 0.97))',
    accentGlow1: 'bg-emerald-600/12',
    accentGlow2: 'bg-amber-500/10',
    badgeText: 'HarvestMitra Farmer Suite',
    badgeIcon: Compass,
    badgeColor: 'bg-emerald-50 text-primary-dark border-border',
    lightOpacity: 0.18,
    darkOpacity: 0.11
  };
}

export default function DashboardLayout() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const moduleTheme = getModuleTheme(location.pathname, user?.role);
  const BadgeIcon = moduleTheme.badgeIcon || Sparkles;

  return (
    <div className={`min-h-screen max-w-full flex flex-col text-text selection:bg-primary/20 selection:text-primary-dark relative ${
      isDark
        ? 'bg-[#0f172a]'
        : 'bg-[#fbfcf9]'
    }`}>
      {/* 1. Full-Page Module-Themed Agricultural Backdrop */}
      {moduleTheme.bgImage && (
        <div 
          aria-hidden="true" 
          className="fixed inset-0 pointer-events-none -z-20 transition-all duration-700 ease-in-out bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${moduleTheme.bgImage}')`,
            opacity: isDark ? (moduleTheme.darkOpacity || 0.10) : (moduleTheme.lightOpacity || 0.18),
            filter: 'saturate(0.9) contrast(1.05)'
          }}
        />
      )}

      {/* 2. Full-Page High-Contrast Readability Overlay */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 transition-colors duration-500"
        style={{
          background: isDark ? moduleTheme.darkOverlay : moduleTheme.lightOverlay
        }}
      />

      {/* 3. Ambient glowing backdrops */}
      <div className={`fixed -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 ${isDark ? 'bg-emerald-900/20' : (moduleTheme.accentGlow1 || 'bg-primary/5')}`} />
      <div className={`fixed -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 ${isDark ? 'bg-indigo-900/15' : (moduleTheme.accentGlow2 || 'bg-emerald-400/5')}`} />

      {/* Top Navbar */}
      <Navbar 
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)} 
        isSidebarOpen={sidebarOpen} 
      />

      {/* Main Workspace Body with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0">
        {/* Left Sidebar (Desktop Static + Mobile Drawer) */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
          {/* Sub-header / Notification banner area */}
          <div className={`border-b px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-surface/60 border-border/80'}`}>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true"></span>
              <span className="font-medium text-text">{t('common.statusReady')}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{t('app.tagline')}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${moduleTheme.badgeColor || 'bg-secondary text-primary-dark border-border'}`}>
                <BadgeIcon className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>{moduleTheme.badgeText || 'HarvestMitra Suite'}</span>
              </div>
            </div>
          </div>

          {/* Sub-page Outlet */}
          <main className="flex-1 min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8" id="dashboard-main-content">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Ambient Low-Connectivity Network Status Badge (Online / Offline APMC Cache) */}
      <NetworkStatusBadge />

      {/* Floating Accessibility & Voice Assistant Bar */}
      <KisanFloatingBar />
    </div>
  );
}
