import { use } from 'react';
import { ThemeContext, type ThemeContextValue } from '@application/theme/ThemeProvider/ThemeContext';

export function useTheme(): ThemeContextValue {
  return use(ThemeContext);
}
