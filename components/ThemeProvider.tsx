'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ColorTheme = 'carbon' | 'ember' | 'aurora';
export type Mode = 'light' | 'dark';

export const COLOR_THEMES: { id: ColorTheme; label: string; accent: string }[] = [
  { id: 'carbon', label: 'CARBON', accent: '#3b82f6' },
  { id: 'ember',  label: 'EMBER',  accent: '#f97316' },
  { id: 'aurora', label: 'AURORA', accent: '#818cf8' },
];

interface ThemeContextValue {
  mode: Mode;
  colorTheme: ColorTheme;
  toggleMode: () => void;
  setColorTheme: (t: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colorTheme: 'carbon',
  toggleMode: () => {},
  setColorTheme: () => {},
});

function applyTheme(mode: Mode, colorTheme: ColorTheme) {
  const html = document.documentElement;
  html.classList.toggle('dark', mode === 'dark');
  html.setAttribute('data-theme', colorTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('dark');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('carbon');

  useEffect(() => {
    const savedMode = (localStorage.getItem('theme-mode') as Mode) ?? 'dark';
    const savedColor = (localStorage.getItem('theme-color') as ColorTheme) ?? 'carbon';
    setMode(savedMode);
    setColorThemeState(savedColor);
    applyTheme(savedMode, savedColor);
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme-mode', next);
      applyTheme(next, colorTheme);
      return next;
    });
  };

  const setColorTheme = (t: ColorTheme) => {
    setColorThemeState(t);
    localStorage.setItem('theme-color', t);
    applyTheme(mode, t);
  };

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, toggleMode, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
