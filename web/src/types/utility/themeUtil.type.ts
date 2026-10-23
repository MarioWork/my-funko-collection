// The colour theme the user picks: always light, always dark, or follow the system.
export const ThemeUtil = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ThemeUtil = (typeof ThemeUtil)[keyof typeof ThemeUtil];
