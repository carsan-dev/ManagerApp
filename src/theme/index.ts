import { MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

export const colors = {
  // Primary palette - Deep elegant tones
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Accent - Warm coral for energy
  accent: '#F97316', // Orange
  accentLight: '#FB923C',
  accentDark: '#EA580C',

  // Background gradient colors
  gradientStart: '#0F0F23',
  gradientMiddle: '#1A1A2E',
  gradientEnd: '#16213E',

  // Surface colors
  surface: '#1E1E32',
  surfaceLight: '#2A2A42',
  surfaceElevated: '#252540',

  // Text colors
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Special
  cardGlass: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.accent,
    secondaryContainer: colors.accentLight,
    background: colors.gradientMiddle,
    surface: colors.surface,
    surfaceVariant: colors.surfaceLight,
    error: colors.error,
    onPrimary: colors.textPrimary,
    onSecondary: colors.textPrimary,
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.cardBorder,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surfaceLight,
      level3: colors.surfaceElevated,
      level4: colors.surfaceElevated,
      level5: colors.surfaceElevated,
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 16,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
};
