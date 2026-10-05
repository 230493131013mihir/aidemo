import React from 'react';
import { Bot, Sparkles, Clock, Mic, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ChatPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" aria-hidden="true" />
            <span>Voice & Text AI Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('chat.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('chat.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ISSUE-09 Planned</span>
          </span>
        </div>
      </div>

      {/* Development Roadmap Callout */}
      <div className="p-4 rounded-xl bg-secondary/80 border border-border flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-text">
            {t('common.comingSoon')}
          </p>
          <p className="text-xs text-muted leading-relaxed">
            {t('chat.note')}
          </p>
        </div>
      </div>

      {/* Voice Assistant Mock UI */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-text">
          Preview: Multilingual Voice Interface Shell
        </h2>

        <div className="card-harvest p-6 space-y-6 max-w-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-text">Mitra Voice Assistant</p>
              <p className="text-xs text-muted">Supports English, ગુજરાતી, हिन्दी, मराठी</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-secondary max-w-[85%] text-xs leading-relaxed text-text">
              <p className="font-semibold text-primary mb-1">🌾 Mitra Assistant:</p>
              "નમસ્તે ખેડૂત મિત્ર! હું તમને પાક વેચવાનો સાચો સમય, બજાર ભાવ અને પરિવહન શોધવામાં મદદ કરી શકું છું. તમે બોલીને અથવા લખીને પ્રશ્ન પૂછી શકો છો."
            </div>

            <div className="p-3.5 rounded-2xl bg-primary text-white max-w-[85%] ml-auto text-xs leading-relaxed">
              "મારા ઘઉં ક્યારે વેચવા જોઈએ? આજે કે આવતા અઠવાડિયે?"
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input 
              type="text"
              disabled
              placeholder="Voice and text AI chat will be active in ISSUE-09..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/60 border border-border text-xs text-muted cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              aria-label="Voice input"
              className="p-2.5 rounded-xl bg-primary text-white opacity-60 cursor-not-allowed"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-primary text-white opacity-60 cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
