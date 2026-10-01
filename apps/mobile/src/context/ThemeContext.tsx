import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { STORAGE_KEYS } from '../config/env';
import { AppTheme, createTheme } from '../theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  theme: AppTheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (err) {
        console.log('Error loading saved theme:', err);
      }
    }
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (err) {
      console.log('Error persisting theme mode:', err);
    }
  };

  const activeMode: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : themeMode;

  const currentTheme = createTheme(activeMode);
  const isDark = activeMode === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        theme: currentTheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    const fallbackTheme = createTheme('dark');
    return {
      themeMode: 'dark' as ThemeMode,
      setThemeMode: async () => {},
      theme: fallbackTheme,
      isDark: true,
    };
  }
  return ctx;
}
