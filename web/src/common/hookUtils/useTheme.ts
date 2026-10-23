import { use } from 'react';
import { ThemeContext, type ThemeContextValue } from '@application/theme/ThemeProvider';

export function useTheme(): ThemeContextValue {
  return use(ThemeContext);
}
