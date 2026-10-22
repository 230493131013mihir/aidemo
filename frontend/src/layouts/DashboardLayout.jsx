import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import KisanFloatingBar from '../components/common/KisanFloatingBar';
import NetworkStatusBadge from '../components/common/NetworkStatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { Bell, Sparkles } from 'lucide-react';

export default function DashboardLayout() {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden flex flex-col bg-gradient-to-br from-[#f8faf8] via-[#fcfbf7] to-[#f4f7f4] text-text selection:bg-primary/20 selection:text-primary-dark relative">
      {/* Ambient glowing backdrops */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <Navbar 
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)} 
        isSidebarOpen={sidebarOpen} 
      />

      {/* Main Workspace Body with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
        {/* Left Sidebar (Desktop Static + Mobile Drawer) */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
          {/* Sub-header / Notification banner area */}
          <div className="bg-surface/60 border-b border-border/80 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true"></span>
              <span className="font-medium text-text">{t('common.statusReady')}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{t('app.tagline')}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-semibold text-primary-dark border border-border">
                <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>HarvestMitra Suite</span>
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
