/**
 * LanguageSelector.jsx
 * Dropdown selector for English, Hindi, Gujarati, Marathi
 * HarvestMitra AI - ISSUE-10
 */

import React from 'react';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../services/speechService';

export default function LanguageSelector({
  selectedLanguage = 'en',
  onLanguageChange,
  disabled = false
}) {
  const languages = Object.values(SUPPORTED_LANGUAGES);

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="mitra-language-select" className="sr-only">
        Select Language
      </label>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800/40 hover:bg-emerald-800/60 border border-emerald-600/30 text-emerald-100 text-xs sm:text-sm font-medium transition-colors shadow-sm">
        <Globe className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
        <select
          id="mitra-language-select"
          value={selectedLanguage}
          disabled={disabled}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Choose interaction language"
          className="bg-transparent text-emerald-100 font-semibold focus:outline-none cursor-pointer text-xs sm:text-sm appearance-none pr-4"
          style={{ backgroundImage: 'none' }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-emerald-950 text-white py-1">
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
        <span className="pointer-events-none text-emerald-300 text-xs">▼</span>
      </div>
    </div>
  );
}
