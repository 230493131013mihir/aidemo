import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  FileCheck2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  Printer
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchChecklistProgress, updateChecklistProgress } from '../../services/schemeApi';

export default function SchemeDetailModal({ scheme, onClose, isAuthenticated }) {
  const { language } = useLanguage();
  const [checkedDocs, setCheckedDocs] = useState([]);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

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

  // Load saved checklist progress
  useEffect(() => {
    async function loadProgress() {
      if (isAuthenticated && scheme.id) {
        try {
          const res = await fetchChecklistProgress(scheme.id);
          if (res && Array.isArray(res.checkedDocumentIds)) {
            setCheckedDocs(res.checkedDocumentIds);
          }
        } catch (err) {
          // Fallback to local storage
          const local = localStorage.getItem(`scheme_checklist_${scheme.id}`);
          if (local) setCheckedDocs(JSON.parse(local));
        }
      } else {
        const local = localStorage.getItem(`scheme_checklist_${scheme.id}`);
        if (local) setCheckedDocs(JSON.parse(local));
      }
    }
    loadProgress();
  }, [scheme.id, isAuthenticated]);

  async function toggleDocument(docId) {
    const updated = checkedDocs.includes(docId)
      ? checkedDocs.filter(id => id !== docId)
      : [...checkedDocs, docId];

    setCheckedDocs(updated);
    localStorage.setItem(`scheme_checklist_${scheme.id}`, JSON.stringify(updated));

    if (isAuthenticated) {
      setIsSavingChecklist(true);
      try {
        await updateChecklistProgress(scheme.id, updated);
      } catch (e) {
      } finally {
        setIsSavingChecklist(false);
      }
    }
  }

  const docs = scheme.requiredDocuments || [];
  const steps = scheme.applicationProcessSteps || [];

  const completedCount = docs.filter(d => checkedDocs.includes(d.id)).length;
  const progressPercent = docs.length > 0 ? Math.round((completedCount / docs.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto relative">
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                {scheme.scope === 'central' ? 'Central Scheme' : `State: ${scheme.stateApplicability}`}
              </span>
              <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Portal: {scheme.officialDomain}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
              {displayName}
            </h2>
            <p className="text-xs text-slate-600">
              Department: {scheme.department}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
          {/* Key Benefit Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
              Financial Benefit Summary
            </span>
            <p className="font-bold text-emerald-950 text-sm sm:text-base leading-snug">
              {displayBenefits}
            </p>
            <p className="text-xs text-emerald-800/80 pt-1">
              {displayDesc}
            </p>
          </div>

          {/* Interactive Document Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-primary" />
                  <span>Interactive Document Checklist</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tick each document as you gather it. Progress is saved automatically.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {completedCount} / {docs.length} Ready ({progressPercent}%)
              </span>
            </div>

            {/* Checklist progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-2 pt-1">
              {docs.map(doc => {
                const isChecked = checkedDocs.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocument(doc.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 text-primary">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className={`font-bold text-xs sm:text-sm ${isChecked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {doc.name}
                      </p>
                      {doc.description && (
                        <p className="text-[11px] text-slate-500">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Application Steps */}
          {steps.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Step-by-Step Official Application Process
              </h3>
              <ol className="space-y-2.5">
                {steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-800 leading-relaxed font-medium">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Exclusion Criteria Alert */}
          {scheme.exclusionCriteria && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Official Exclusion Criteria (Who Cannot Apply)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90 pl-5">
                {scheme.exclusionCriteria}
              </p>
            </div>
          )}

          {/* Official Disclaimers */}
          <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 space-y-1">
            <p>
              <strong>Official Portal Requirement:</strong> HarvestMitra AI is an independent agritech advisory tool. All official applications must be executed directly on verified government domains (such as <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">{scheme.officialDomain}</code>).
            </p>
          </div>
        </div>

        {/* Modal Sticky Footer with Direct Links */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified from: {scheme.officialDomain}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors"
            >
              Close
            </button>

            <a
              href={scheme.officialApplicationUrl || scheme.officialInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-md shadow-primary/20 transition-all"
            >
              <span>{scheme.officialApplicationUrl ? 'Open Official Application Portal' : 'Open Official Information Page'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
