import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { darkTheme, lightTheme, Theme } from '@/services/theme/tokens';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  usingSystem: boolean;
};

// Minimal theme fallback so we never return theme: undefined (e.g. in lazy bundles or odd load order)
const FALLBACK_THEME: Theme = {
  colors: {
    primary: '#264FD4',
    ctaCardAccent: '#4D74ED',
    profileHeader: '#264FD4',
    secondary: '#12BFA1',
    onPrimary: '#FFFFFF',
    onSecondary: '#0E141B',
    link: '#264FD4',
    background: '#F4F8FF',
    success: '#2E7D32',
    error: '#D32F2F',
    text: '#0D1B2A',
    mutedText: '#4A5A70',
    card: '#FFFFFF',
    border: '#E5EAF2',
  },
  spacing: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 16, round: 999 },
  typography: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
};

// Resolve default theme at call time so it's always defined even in lazy bundles or odd load order
function getDefaultThemeValue(): ThemeContextValue {
  const theme =
    typeof lightTheme !== 'undefined' && lightTheme != null ? lightTheme : FALLBACK_THEME;
  return {
    theme,
    mode: 'system',
    isDark: false,
    toggleTheme: () => {},
    setMode: () => {},
    usingSystem: true,
  };
}
const Ctx = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'app:themeMode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialSystem = Appearance.getColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    (initialSystem ?? 'light') === 'dark' ? 'dark' : 'light',
  );

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

  const setMode = useCallback(
    (m: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
      setModeState((prev) =>
        typeof m === 'function' ? (m as (p: ThemeMode) => ThemeMode)(prev) : m,
      );
      const next = typeof m === 'function' ? (m as (p: ThemeMode) => ThemeMode)(mode) : m;
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    },
    [mode],
  );

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

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(Ctx);
  // Single code path: never return null/undefined; always return object with theme (avoids Hermes "Property 'theme' doesn't exist")
  const safe: ThemeContextValue = ctx && ctx.theme ? ctx : getDefaultThemeValue();
  return safe;
}
