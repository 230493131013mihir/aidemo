import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(undefined);

const THEME_KEY = 'harvestmitra-theme';

/**
 * ThemeProvider - Manages dark/light mode with localStorage persistence.
 * Applies 'dark' class to <html> element for Tailwind dark: support.
 * Also applies data-theme attribute for custom CSS variable overrides.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
    // Default to light mode for farmer-friendly experience
    return 'light';
  });

  const isDark = theme === 'dark';

  // Apply theme class + data attribute to document root
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    // Persist
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Silently fail
    }
  }, [theme, isDark]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme hook - Access the current theme state and toggle function.
 * @returns {{ theme: 'dark'|'light', isDark: boolean, toggleTheme: () => void, setTheme: (t: 'dark'|'light') => void }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
