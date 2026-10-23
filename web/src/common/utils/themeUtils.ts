import { Moon, Sun, SunMoon, type LucideIcon } from 'lucide-react';
import { ThemeUtil } from '@app-types/utility';

const THEME_STORAGE_KEY = 'funkos.theme';

// What the page actually shows once "system" is resolved.
type ResolvedTheme = typeof ThemeUtil.LIGHT | typeof ThemeUtil.DARK;

export type ThemeOption = {
  value: ThemeUtil;
  label: string;
  icon: LucideIcon;
};

// The three choices, in the order every theme control lists them.
export const THEME_OPTIONS: ThemeOption[] = [
  { value: ThemeUtil.LIGHT, label: 'Light', icon: Sun },
  { value: ThemeUtil.DARK, label: 'Dark', icon: Moon },
  { value: ThemeUtil.SYSTEM, label: 'System', icon: SunMoon },
];

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_MS = 220;

function isTheme(value: unknown): value is ThemeUtil {
  return value === ThemeUtil.LIGHT || value === ThemeUtil.DARK || value === ThemeUtil.SYSTEM;
}

export function readStoredTheme(): ThemeUtil {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isTheme(stored) ? stored : ThemeUtil.SYSTEM;
  } catch {
    return ThemeUtil.SYSTEM;
  }
}

export function storeTheme(theme: ThemeUtil): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice lives for this page only.
  }
}

function resolveTheme(theme: ThemeUtil): ResolvedTheme {
  if (theme !== ThemeUtil.SYSTEM) return theme;

  return window.matchMedia(DARK_SCHEME_QUERY).matches ? ThemeUtil.DARK : ThemeUtil.LIGHT;
}

// Mirrors public/theme-init.js, which runs before React for a flash-free first paint.
export function applyTheme(theme: ThemeUtil, { withTransition = false } = {}): void {
  const root = window.document.documentElement;
  const resolved = resolveTheme(theme);

  if (withTransition) {
    root.classList.add(TRANSITION_CLASS);
    window.setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS);
  }

  root.classList.toggle(ThemeUtil.DARK, resolved === ThemeUtil.DARK);
  root.classList.toggle(ThemeUtil.LIGHT, resolved === ThemeUtil.LIGHT);
}

export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_SCHEME_QUERY);

  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}
