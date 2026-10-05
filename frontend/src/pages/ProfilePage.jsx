import React from 'react';
import { User, Sparkles, Clock, Globe, Sprout } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/common/LanguageSelector';

export default function ProfilePage() {
  const { t, currentLanguageMeta } = useLanguage();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <User className="w-4 h-4" aria-hidden="true" />
            <span>Farmer Profile & Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('profile.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('profile.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-secondary text-primary-dark border border-border">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Profile Module</span>
          </span>
        </div>
      </div>

      {/* Notice */}
      <div className="p-4 rounded-xl bg-secondary/80 border border-border flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-text">
            {t('common.comingSoon')}
          </p>
          <p className="text-xs text-muted leading-relaxed">
            {t('profile.note')}
          </p>
        </div>
      </div>

      {/* Profile Details & Language Setting Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Language Setting */}
        <div className="card-harvest p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {t('nav.language')} Settings
              </h3>
              <p className="text-xs text-muted">
                Active: {currentLanguageMeta.nativeName} ({currentLanguageMeta.label})
              </p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              {t('common.selectLanguage')}
            </p>
            <LanguageSelector variant="segmented" className="w-full justify-between" />
          </div>
        </div>

        {/* Farmer Info Preview */}
        <div className="card-harvest p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
              <Sprout className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                Demo Farmer Profile
              </h3>
              <p className="text-xs text-muted">
                Sample profile for hackathon demonstration
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted pt-2 border-t border-border/60">
            <div className="flex justify-between py-1">
              <span className="font-semibold text-text">Farm Location:</span>
              <span>Kadi, Mehsana District, Gujarat</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-text">Primary Crops:</span>
              <span>Wheat (Sharbati), Mustard</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-text">Total Land:</span>
              <span>8.5 Acres</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
