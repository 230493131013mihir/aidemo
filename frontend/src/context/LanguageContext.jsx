/* eslint-disable react-refresh/only-export-components */
import React, { useState, useMemo, useCallback } from 'react';
import { en } from '../locales/en.js';
import { gu } from '../locales/gu.js';
import { hi } from '../locales/hi.js';
import { mr } from '../locales/mr.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './LanguageConstants.js';
import { LanguageContext } from './LanguageContextInstance.js';

export { useLanguage } from '../hooks/useLanguage.js';
export { LanguageContext };


const TRANSLATIONS = {
  en,
  gu,
  hi,
  mr,
};

// Safe nested value resolver: "nav.dashboard" -> translations[lang].nav.dashboard
function resolveKey(obj, keyPath) {
  if (!obj || !keyPath) return undefined;
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem('harvestmitra_lang');
      if (stored && TRANSLATIONS[stored]) {
        return stored;
      }
    } catch {
      // Safe fallback if localStorage is disabled/inaccessible
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((langCode) => {
    // Validate language code; if invalid, default to English
    const safeLang = TRANSLATIONS[langCode] ? langCode : DEFAULT_LANGUAGE;
    setLanguageState(safeLang);
    try {
      localStorage.setItem('harvestmitra_lang', safeLang);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Translation lookup with safe fallback chain
  const t = useCallback((key, fallback) => {
    if (!key) return '';

    // 1. Check current language
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const value = resolveKey(currentDict, key);
    if (value !== undefined) {
      return value;
    }

    // 2. Safe fallback to English dictionary
    if (language !== DEFAULT_LANGUAGE) {
      const enValue = resolveKey(TRANSLATIONS[DEFAULT_LANGUAGE], key);
      if (enValue !== undefined) {
        return enValue;
      }
    }

    // 3. Fallback parameter or readable fallback
    if (fallback !== undefined) {
      return fallback;
    }

    // 4. Return formatted key segment instead of crashing
    const lastKeySegment = key.split('.').pop() || key;
    return lastKeySegment.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguageMeta: SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0],
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
