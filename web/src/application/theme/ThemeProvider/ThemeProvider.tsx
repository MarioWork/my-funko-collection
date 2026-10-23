import { useEffect, useState, type ReactNode } from 'react';
import { applyTheme, readStoredTheme, storeTheme, ThemeUtil, watchSystemTheme } from '../themeUtils';
import { ThemeContext } from './ThemeContext';

type Props = {
  children: ReactNode;
};

// Light / dark / system, remembered in localStorage. The first paint is handled by public/theme-init.js.
function ThemeProvider({ children }: Props) {
  const [theme, setThemeState] = useState<ThemeUtil>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    const isFollowingSystem = theme === ThemeUtil.SYSTEM;

    if (!isFollowingSystem) return undefined;

    return watchSystemTheme(() => applyTheme(ThemeUtil.SYSTEM));
  }, [theme]);

  const setTheme = (next: ThemeUtil) => {
    storeTheme(next);
    applyTheme(next, { withTransition: true });
    setThemeState(next);
  };

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

export default ThemeProvider;
