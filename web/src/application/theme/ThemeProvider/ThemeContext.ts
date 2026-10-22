import { createContext } from 'react';
import { ThemeUtil } from '../themeUtils';

export type ThemeContextValue = {
  theme: ThemeUtil;
  setTheme: (theme: ThemeUtil) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: ThemeUtil.SYSTEM,
  setTheme: () => undefined,
});
