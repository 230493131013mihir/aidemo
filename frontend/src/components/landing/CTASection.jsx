import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function CTASection() {
  const { t } = useLanguage();

  return (
    <section 
      id="cta" 
      className="py-16 sm:py-24 bg-gradient-to-b from-transparent to-secondary/60"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-harvest p-8 sm:p-12 text-center space-y-8 bg-surface border-2 border-primary/20 shadow-lg relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-accent/10 blur-2xl pointer-events-none"></div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-primary shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>{t('cta.badge')}</span>
          </div>

          {/* Headings */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
              {t('cta.title')}
            </h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              {t('cta.subtitle')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/dashboard"
              id="cta-bottom-get-started"
              className="btn-primary w-full sm:w-auto text-base px-8 py-3.5 shadow-md hover:shadow-lg transition-all"
            >
              <span>{t('cta.getStarted')}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              to="/dashboard"
              id="cta-bottom-explore-demo"
              className="btn-secondary w-full sm:w-auto text-base px-8 py-3.5"
            >
              <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t('cta.exploreDemo')}</span>
            </Link>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="pt-6 border-t border-border/80 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              100% Free Hackathon Prototype
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              4 Indian Languages Supported
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              No Complex Setup Required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
