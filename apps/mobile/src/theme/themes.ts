import { darkColors, lightColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const lightTheme = {
  mode: 'light' as const,
  colors: lightColors,
  spacing,
  radius,
  typography,
  shadows,
};

export const darkTheme = {
  mode: 'dark' as const,
  colors: darkColors,
  spacing,
  radius,
  typography,
  shadows,
};
