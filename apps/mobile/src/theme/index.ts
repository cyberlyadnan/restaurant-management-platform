import { darkColors, lightColors, ThemeColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export * from './colors';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';

export const theme = {
  colors: darkColors,
  spacing,
  radius,
  typography,
  shadows,
};

export const createTheme = (mode: 'light' | 'dark') => ({
  mode,
  colors: mode === 'light' ? lightColors : darkColors,
  spacing,
  radius,
  typography,
  shadows,
});

export type AppTheme = ReturnType<typeof createTheme>;
