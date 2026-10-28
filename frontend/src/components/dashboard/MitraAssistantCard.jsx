import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, ArrowRight, MessageSquare, Mic } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function MitraAssistantCard() {
  const { t } = useLanguage();

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-lg border border-emerald-700/40 text-white flex flex-col justify-between space-y-4">
      {/* Background Photographic Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url('/images/dashboard-hero.jpg')` }}
      />
      {/* High-Contrast Dark Overlay & Emerald Glowing Gradient */}
      <div className="absolute inset-0 bg-slate-950/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/85 to-teal-950/80 backdrop-blur-[0.5px]" />
      <div className="absolute inset-0 bg-radial-at-t from-emerald-400/20 via-transparent to-black/40 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/25 text-emerald-300 flex items-center justify-center border border-emerald-400/35 backdrop-blur-md">
              <Bot className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-black text-base text-white" style={{ color: '#FFFFFF' }}>
              {t('dashboard.mitraAssistant.cardTitle')}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            4 Languages
          </span>
        </div>

        {/* Body */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-sm sm:text-base text-white leading-snug drop-shadow-sm" style={{ color: '#FFFFFF' }}>
            {t('dashboard.mitraAssistant.promptTitle')}
          </h4>
          <p className="text-xs leading-relaxed font-normal" style={{ color: '#F1F5F9' }}>
            Ask questions in Gujarati, Hindi, Marathi, or English about crop harvesting timing, pesticide remedies, or today&apos;s APMC mandi rates.
          </p>
        </div>

        {/* Action CTA */}
        <div className="pt-2 border-t border-white/15">
          <Link
            to="/chat"
            id="btn-dashboard-open-mitra"
            className="w-full text-xs py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-500 hover:to-primary-dark text-white font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Mic className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>{t('dashboard.mitraAssistant.buttonText')}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

