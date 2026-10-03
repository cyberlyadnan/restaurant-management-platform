export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  text: string;
  textDim: string;
  border: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  secondary: string;
  secondaryLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  veg: string;
  nonVeg: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceSubtle: '#f1f5f9',
  surfaceBorder: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  text: '#0f172a',
  textDim: '#64748b',
  border: '#cbd5e1',
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  primaryLight: '#e0e7ff',
  primarySoft: 'rgba(79, 70, 229, 0.1)',
  secondary: '#f97316',
  secondaryLight: '#ffedd5',
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#eff6ff',
  veg: '#16a34a',
  nonVeg: '#dc2626',
  overlay: 'rgba(15, 23, 42, 0.6)',
};

export const darkColors: ThemeColors = {
  background: '#090d16',
  surface: '#111827',
  surfaceElevated: '#1f2937',
  surfaceSubtle: '#1f2937',
  surfaceBorder: '#374151',
  textPrimary: '#f9fafb',
  textSecondary: '#cbd5e1',
  textMuted: '#9ca3af',
  text: '#f9fafb',
  textDim: '#9ca3af',
  border: '#374151',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#1e1b4b',
  primarySoft: 'rgba(99, 102, 241, 0.15)',
  secondary: '#f97316',
  secondaryLight: '#7c2d12',
  success: '#10b981',
  successLight: '#064e3b',
  warning: '#f59e0b',
  warningLight: '#78350f',
  danger: '#ef4444',
  dangerLight: '#7f1d1d',
  info: '#3b82f6',
  infoLight: '#1e3a8a',
  veg: '#22c55e',
  nonVeg: '#ef4444',
  overlay: 'rgba(0, 0, 0, 0.75)',
};
