'use client';
import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const THEME_KEY = 'pgg_theme';

const read = (): Theme => {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

const apply = (theme: Theme) => document.documentElement.setAttribute('data-theme', theme);

/** Current theme, persisted per device; applies it to <html data-theme>. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  useEffect(() => {
    const t = read();
    setThemeState(t);
    apply(t);
  }, []);
  const setTheme = (t: Theme) => {
    setThemeState(t);
    apply(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  };
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}

/** Mounted once in the root layout so the saved theme applies on every page. */
export function ThemeInit() {
  useTheme();
  return null;
}
