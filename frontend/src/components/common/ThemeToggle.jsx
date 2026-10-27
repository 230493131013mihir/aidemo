import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ThemeToggle - High-contrast dark/light mode switch.
 * Designed for navbar and sidebar placement with smooth animations.
 * Uses accessible toggle button pattern with aria-label.
 */
export default function ThemeToggle({ variant = 'pill', className = '' }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage?.() || { t: (_, d) => d };

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        id="sidebar-theme-toggle"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group
          ${isDark
            ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
            : 'text-text hover:bg-secondary hover:text-primary border border-transparent'
          } ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isDark ? (
            <Moon className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
          ) : (
            <Sun className="w-4 h-4 shrink-0 text-amber-500" aria-hidden="true" />
          )}
          <span className="truncate">{isDark ? t('theme.darkMode', 'Dark Mode') : t('theme.lightMode', 'Light Mode')}</span>
        </div>
        {/* Mini toggle indicator */}
        <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${isDark ? 'bg-emerald-600' : 'bg-slate-300'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </button>
    );
  }

  // Default: compact pill for navbar
  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="navbar-theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center gap-1.5 p-2 rounded-xl border transition-all duration-300 cursor-pointer
        ${isDark
          ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:border-slate-600 shadow-sm shadow-amber-500/10'
          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-amber-600 hover:border-amber-200'
        } ${className}`}
    >
      <div className="relative w-4 h-4">
        {/* Sun icon - visible in light mode */}
        <Sun
          className={`w-4 h-4 absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          aria-hidden="true"
        />
        {/* Moon icon - visible in dark mode */}
        <Moon
          className={`w-4 h-4 absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
