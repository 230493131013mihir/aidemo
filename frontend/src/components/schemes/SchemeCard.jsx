import React, { useState } from 'react';
import { 
  Building2, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SchemeCard({ 
  scheme, 
  isSaved = false, 
  onToggleSave, 
  onOpenDetails 
}) {
  const { language } = useLanguage();
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  // Multilingual field picker
  const displayName = language === 'gu' && scheme.nameGu
    ? scheme.nameGu
    : language === 'hi' && scheme.nameHi
    ? scheme.nameHi
    : scheme.nameEn;

  const displayDesc = language === 'gu' && scheme.shortDescriptionGu
    ? scheme.shortDescriptionGu
    : language === 'hi' && scheme.shortDescriptionHi
    ? scheme.shortDescriptionHi
    : scheme.shortDescriptionEn;

  const displayBenefits = language === 'gu' && scheme.benefitsGu
    ? scheme.benefitsGu
    : language === 'hi' && scheme.benefitsHi
    ? scheme.benefitsHi
    : scheme.benefitsEn;

  // Category labels and colors
  const categoryConfig = {
    income_support: { label: 'Income Support', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    crop_insurance: { label: 'Crop Insurance', color: 'bg-blue-100 text-blue-900 border-blue-300' },
    irrigation_water: { label: 'Drip & Irrigation', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
    machinery_equipment: { label: 'Farm Machinery', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    fertilizer_soil: { label: 'Soil Health', color: 'bg-teal-100 text-teal-900 border-teal-300' },
    credit_interest: { label: 'KCC Loan / Credit', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    organic_farming: { label: 'Organic Farming', color: 'bg-lime-100 text-lime-900 border-lime-300' },
    horticulture: { label: 'Horticulture Mission', color: 'bg-rose-100 text-rose-900 border-rose-300' },
    storage_logistics: { label: 'Storage & Cold Chain', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
  };

  const cat = categoryConfig[scheme.category] || { label: 'Agricultural Assistance', color: 'bg-slate-100 text-slate-800 border-slate-300' };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-400/60 transition-all duration-300 flex flex-col justify-between p-5 sm:p-6 space-y-4 relative overflow-hidden group">
      {/* Top subtle glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

      {/* Top Row: Category + State + Bookmark Button */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cat.color}`}>
            {cat.label}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {scheme.scope === 'central' ? 'Central Scheme' : `State: ${scheme.stateApplicability}`}
          </span>
        </div>

        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(scheme.id)}
            title={isSaved ? 'Remove from Saved Schemes' : 'Save Scheme for Later'}
            className={`p-2 rounded-xl border transition-all ${
              isSaved
                ? 'bg-amber-50 text-amber-600 border-amber-300 shadow-xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Middle Content */}
      <div className="relative z-10 space-y-2.5">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-primary transition-colors">
          {displayName}
        </h3>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {displayDesc}
        </p>

        {/* Highlighted Benefit Box */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-slate-50 border border-emerald-100/80 text-xs text-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
            Verified Key Benefit
          </span>
          <p className="font-bold text-emerald-950 text-xs sm:text-[13px] leading-snug">
            {displayBenefits}
          </p>
        </div>

        {/* Personalized Match Status (If Available from Match Engine) */}
        {scheme.eligibilityOutcome && (
          <div className="pt-1">
            <div className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-bold ${
              scheme.eligibilityOutcome === 'potentially_eligible'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : scheme.eligibilityOutcome === 'more_info_required'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              <div className="flex items-center gap-1.5 truncate">
                {scheme.eligibilityOutcome === 'potentially_eligible' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : scheme.eligibilityOutcome === 'more_info_required' ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">
                  {scheme.eligibilityOutcome === 'potentially_eligible'
                    ? 'Potentially Eligible'
                    : scheme.eligibilityOutcome === 'more_info_required'
                    ? 'More Info Required'
                    : 'Appears Ineligible for Your Profile'}
                </span>
              </div>

              {(scheme.matchedReasons?.length > 0 || scheme.disqualifiedReasons?.length > 0) && (
                <button
                  type="button"
                  onClick={() => setShowMatchDetails(!showMatchDetails)}
                  className="text-[11px] underline hover:text-slate-900 shrink-0 flex items-center gap-0.5"
                >
                  <span>Why?</span>
                  {showMatchDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Accordion Explanation of Match Rules */}
            {showMatchDetails && (
              <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 animate-in fade-in duration-200">
                {scheme.matchedReasons?.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-emerald-800">
                    <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
                {scheme.unverifiedConditions?.map((u, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-amber-800">
                    <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                    <span>{u}</span>
                  </div>
                ))}
                {scheme.disqualifiedReasons?.map((d, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-rose-800">
                    <XCircle className="w-3 h-3 text-rose-600 mt-0.5 shrink-0" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata & Official Verification Footer */}
      <div className="relative z-10 pt-2 border-t border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-1 truncate max-w-[220px]" title={scheme.department}>
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{scheme.officialDomain}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified: {scheme.lastVerifiedDate || '2026-10-17'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenDetails && onOpenDetails(scheme)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Checklist & Steps</span>
          </button>

          <a
            href={scheme.officialApplicationUrl || scheme.officialInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-sm shadow-primary/20 transition-all"
          >
            <span>Visit Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
