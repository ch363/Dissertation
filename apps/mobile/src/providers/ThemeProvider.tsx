import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  usingSystem: boolean;
};

const Ctx = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'app:themeMode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialSystem = Appearance.getColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>((initialSystem ?? 'light') === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved as ThemeMode);
        }
      } catch {}
    })();
  }, []);

  // Follow system theme changes when in 'system' mode
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      const next = colorScheme === 'dark' ? 'dark' : 'light';
      setSystemScheme(next);
    });
    return () => {
      // RN returns an object with remove method
      // @ts-ignore - compatibility across RN versions
      sub?.remove?.();
    };
  }, []);

  const setMode = useCallback((m: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    setModeState((prev) => (typeof m === 'function' ? (m as (p: ThemeMode) => ThemeMode)(prev) : m));
    const next = typeof m === 'function' ? (m as (p: ThemeMode) => ThemeMode)(mode) : m;
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev: ThemeMode) => {
      const current = prev === 'system' ? systemScheme : prev;
      return current === 'light' ? 'dark' : 'light';
    });
  }, [setMode, systemScheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const effective = mode === 'system' ? systemScheme : mode;
    const isDark = effective === 'dark';
    return {
      theme: isDark ? darkTheme : lightTheme,
      mode,
      isDark,
      toggleTheme,
      setMode,
      usingSystem: mode === 'system',
    };
  }, [mode, systemScheme, toggleTheme, setMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
