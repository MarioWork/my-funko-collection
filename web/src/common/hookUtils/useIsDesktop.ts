import { useMediaQuery } from '@hooks/useMediaQuery';

// Tailwind's `lg`: the shell switches from bottom nav to sidebar here.
const DESKTOP_QUERY = '(min-width: 1024px)';

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
