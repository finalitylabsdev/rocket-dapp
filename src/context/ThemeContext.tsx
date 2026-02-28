import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { safeGetStorageItem, safeSetStorageItem } from '../lib/safeStorage';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  ambientFxEnabled: boolean;
  toggleAmbientFx: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  return 'light';
}

function getInitialAmbientFx(): boolean {
  if (typeof window === 'undefined') return true;
  return safeGetStorageItem('entropy-ambient-fx') !== 'disabled';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [ambientFxEnabled, setAmbientFxEnabled] = useState<boolean>(getInitialAmbientFx);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', '#FFFFFF');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-ambient-fx', ambientFxEnabled ? 'enabled' : 'disabled');
    safeSetStorageItem('entropy-ambient-fx', ambientFxEnabled ? 'enabled' : 'disabled');
  }, [ambientFxEnabled]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleAmbientFx = () => setAmbientFxEnabled((enabled) => !enabled);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, ambientFxEnabled, toggleAmbientFx }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
