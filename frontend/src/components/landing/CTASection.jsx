import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function CTASection() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <section 
      id="cta" 
      className="py-16 sm:py-24 relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 text-white p-8 sm:p-14 text-center space-y-8">
          {/* Photographic Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('/images/harvest-hero.jpg')` }}
          />
          {/* Rich Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/90 to-slate-950/95 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-radial-at-t from-emerald-500/20 via-transparent to-black/60 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-300 shadow-md backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" aria-hidden="true" />
              <span>{t('cta.badge')}</span>
            </div>

            {/* Headings */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 id="cta-heading" className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {t('cta.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed drop-shadow-sm">
                {t('cta.subtitle')}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                id="cta-bottom-get-started"
                className="btn-primary w-full sm:w-auto text-base px-8 py-3.5 shadow-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2 group"
              >
                <span>{isAuthenticated ? 'Go to Dashboard →' : t('cta.getStarted')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>

              <Link
                to="/markets"
                id="cta-bottom-explore-demo"
                className="w-full sm:w-auto text-base px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/25 backdrop-blur-md transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>{t('cta.exploreDemo')}</span>
              </Link>
            </div>

            {/* Bottom Trust Indicators */}
            <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Real-Time APMC Mandi Rates
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                4 Indian Languages Supported
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Shared Freight Savings Up To 45%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

