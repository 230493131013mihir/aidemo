import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Heart, ShieldCheck, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const { t, currentLanguageMeta } = useLanguage();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-border bg-surface text-text mt-auto transition-colors" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <Sprout className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-bold text-xl text-text">
                Harvest<span className="text-primary">Mitra</span> AI
              </span>
            </Link>

            <p className="text-sm text-muted max-w-sm leading-relaxed">
              {t('footer.brandDescription')}
            </p>

            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>Transparent Math & Logistics Engine</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('hero')}
                  className="text-muted hover:text-primary transition-colors text-left"
                >
                  {t('footer.home')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="text-muted hover:text-primary transition-colors text-left"
                >
                  {t('footer.features')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-muted hover:text-primary transition-colors text-left"
                >
                  {t('footer.howItWorks')}
                </button>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted hover:text-primary transition-colors">
                  {t('footer.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Areas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              {t('footer.productAreas')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/markets" className="text-muted hover:text-primary transition-colors">
                  {t('footer.markets')}
                </Link>
              </li>
              <li>
                <Link to="/harvest" className="text-muted hover:text-primary transition-colors">
                  {t('footer.harvest')}
                </Link>
              </li>
              <li>
                <Link to="/transport" className="text-muted hover:text-primary transition-colors">
                  {t('footer.transport')}
                </Link>
              </li>
              <li>
                <Link to="/weather" className="text-muted hover:text-primary transition-colors">
                  {t('footer.weather')}
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-muted hover:text-primary transition-colors">
                  {t('footer.chat')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Project & Multilingual Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              {t('footer.projectInfoTitle')}
            </h4>
            <div className="p-3.5 rounded-xl bg-secondary/80 border border-border space-y-2.5 text-xs text-muted">
              <p className="leading-relaxed">
                {t('footer.projectInfoDesc')}
              </p>
              <div className="pt-2 border-t border-border flex items-center gap-1.5 text-primary font-semibold">
                <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{currentLanguageMeta.nativeName} ({currentLanguageMeta.label})</span>
              </div>
              <p className="text-[11px] text-muted leading-tight">
                {t('footer.languagesNotice')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>
            © {CURRENT_YEAR} {t('footer.copyright')}
          </p>
          <p className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-error fill-error inline" aria-hidden="true" />
            <span>for AgriTech Hackathon</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
