import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, Menu, X, Sparkles, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../common/LanguageSelector';

export default function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Branding & Agriculture Icon */}
          <Link
            to="/"
            id="header-brand-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-text group-hover:text-primary transition-colors">
                Harvest<span className="text-primary">Mitra</span> <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold ml-1">AI</span>
              </span>
              <span className="text-[10px] text-muted font-medium tracking-wide">
                Smart Decisions • Better Harvests
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Landing page navigation">
            <button
              type="button"
              onClick={() => handleSectionClick('hero')}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text hover:text-primary hover:bg-secondary/70 transition-colors"
            >
              {t('nav.home')}
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('features')}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text hover:text-primary hover:bg-secondary/70 transition-colors"
            >
              {t('nav.features')}
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('how-it-works')}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text hover:text-primary hover:bg-secondary/70 transition-colors"
            >
              {t('nav.howItWorks')}
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text hover:text-primary hover:bg-secondary/70 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t('nav.dashboard')}</span>
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <LanguageSelector id="header-language-selector" />

            {/* Explore Demo CTA */}
            <Link
              to="/dashboard"
              id="header-explore-demo-btn"
              className="hidden sm:inline-flex btn-secondary text-xs sm:text-sm py-2 px-3.5 shadow-xs"
            >
              <span>{t('nav.exploreDemo')}</span>
            </Link>

            {/* Get Started CTA */}
            <Link
              to="/dashboard"
              id="header-get-started-btn"
              className="btn-primary text-xs sm:text-sm py-2 px-3.5 sm:px-4 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span>{t('nav.getStarted')}</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              id="header-mobile-toggle"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('nav.close') : t('nav.menu')}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-text hover:bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div 
          id="header-mobile-menu"
          className="md:hidden border-t border-border bg-surface px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150"
        >
          <div className="text-xs font-semibold uppercase text-muted tracking-wider px-3">
            {t('nav.menu')}
          </div>
          <nav className="space-y-1" aria-label="Mobile navigation">
            <button
              type="button"
              onClick={() => handleSectionClick('hero')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-text hover:bg-secondary flex items-center justify-between"
            >
              <span>{t('nav.home')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('features')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-text hover:bg-secondary flex items-center justify-between"
            >
              <span>{t('nav.features')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('how-it-works')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-text hover:bg-secondary flex items-center justify-between"
            >
              <span>{t('nav.howItWorks')}</span>
            </button>
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-text hover:bg-secondary flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t('nav.dashboard')}</span>
            </Link>
          </nav>

          <div className="pt-3 border-t border-border space-y-2">
            <div className="text-xs font-semibold uppercase text-muted tracking-wider px-3">
              {t('common.selectLanguage')}
            </div>
            <LanguageSelector variant="segmented" className="w-full justify-center" />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary text-xs py-2 px-3 text-center justify-center"
              >
                {t('nav.exploreDemo')}
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-xs py-2 px-3 text-center justify-center"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
