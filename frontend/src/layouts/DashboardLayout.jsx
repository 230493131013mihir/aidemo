import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { Bell, Sparkles } from 'lucide-react';

export default function DashboardLayout() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background text-text selection:bg-primary/20 selection:text-primary-dark">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Body with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex min-h-[calc(100vh-4rem)]" />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sub-header / Notification banner area */}
          <div className="bg-surface/60 border-b border-border/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true"></span>
              <span className="font-medium text-text">{t('common.statusReady')}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{t('app.tagline')}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Placeholder */}
              <button 
                type="button" 
                aria-label={t('nav.notifications')} 
                title={t('nav.notifications')}
                className="relative p-1.5 rounded-lg text-muted hover:text-text hover:bg-secondary transition-colors"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" aria-hidden="true"></span>
              </button>

              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-semibold text-primary-dark border border-border">
                <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>HarvestMitra Suite</span>
              </div>
            </div>
          </div>

          {/* Sub-page Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8" id="dashboard-main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
