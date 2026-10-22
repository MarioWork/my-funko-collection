import { useSyncExternalStore } from 'react';

// Tailwind's `lg`: the shell switches from bottom nav to sidebar here.
export const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribe(query: string, onChange: () => void): () => void {
  const list = window.matchMedia(query);

  list.addEventListener('change', onChange);

  return () => list.removeEventListener('change', onChange);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
