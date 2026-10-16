import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelector({ variant = 'dropdown', className = '' }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  if (variant === 'segmented') {
    return (
      <div 
        role="group" 
        aria-label="Language selection" 
        className={`inline-flex items-center p-1 rounded-xl bg-secondary/80 border border-border ${className}`}
      >
        {supportedLanguages.map((lang) => {
          const isSelected = lang.code === language;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={isSelected}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text hover:bg-black/5'
              }`}
            >
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="language-selector-button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select application language"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text bg-surface hover:bg-secondary/60 border border-border rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <Languages className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <span className="font-semibold">{activeLang.nativeName}</span>
        <span className="text-xs text-muted font-normal hidden sm:inline">({activeLang.label})</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          aria-hidden="true" 
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-selector-button"
          className="absolute right-0 z-[100] mt-2 w-56 origin-top-right rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-1.5 focus:outline-none ring-1 ring-black/5 divide-y divide-slate-100"
        >
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Select Language • ભાષા પસંદ કરો
          </div>
          <div className="py-1 space-y-0.5">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm rounded-xl transition-all ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/60 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold leading-tight text-slate-900">{lang.nativeName}</span>
                    <span className="text-[11px] text-slate-500 font-normal">{lang.label}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
