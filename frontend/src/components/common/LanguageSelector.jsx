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
          className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-surface border border-border shadow-lg p-1.5 focus:outline-none transition-all"
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted tracking-wider uppercase">
            Select Language
          </div>
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
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text hover:bg-secondary'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="leading-tight">{lang.nativeName}</span>
                  <span className="text-xs text-muted font-normal">{lang.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
