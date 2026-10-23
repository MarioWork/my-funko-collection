import type { ReactNode } from 'react';
import { useOutlet } from 'react-router';
import { useIsDesktop } from '@hooks/useMediaQuery';

// A page whose child route is a form (FormPanel): on phones the form is its own page, so the parent renders only
// the child. Returns that child on phones while one is open, null otherwise:
//   const childPage = useMobileChildPage();
//   if (childPage) return childPage;
export function useMobileChildPage(): ReactNode {
  const outlet = useOutlet();
  const isDesktop = useIsDesktop();

  if (isDesktop) return null;

  return outlet;
}
