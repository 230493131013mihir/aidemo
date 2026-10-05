import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function MitraAssistantCard() {
  const { t } = useLanguage();

  return (
    <div className="card-harvest p-5 sm:p-6 bg-gradient-to-br from-surface to-secondary/70 border-border flex flex-col justify-between space-y-4 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-primary/10 blur-xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Bot className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-base text-text">
            {t('dashboard.mitraAssistant.cardTitle')}
          </h3>
        </div>
        <span className="badge-tag bg-primary-50 text-primary border border-primary/20 text-[10px]">
          <Sparkles className="w-3 h-3 text-accent" />
          AI Voice
        </span>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm sm:text-base text-text leading-snug">
          {t('dashboard.mitraAssistant.promptTitle')}
        </h4>
        <p className="text-xs text-muted leading-relaxed">
          {t('dashboard.mitraAssistant.promptDesc')}
        </p>
      </div>

      {/* Action CTA */}
      <div className="pt-2 border-t border-border/60">
        <Link
          to="/chat"
          id="btn-dashboard-open-mitra"
          className="btn-primary w-full text-xs py-2.5 px-4 justify-center gap-2 shadow-xs"
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('dashboard.mitraAssistant.buttonText')}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
