import type { ReactNode } from 'react';
import { useOutlet } from 'react-router';
import { useIsDesktop } from '@hooks/useIsDesktop';
import { ENTER_FROM_RIGHT_CLASS } from '@utils/motionUtils';

// A page whose child route is a form (FormPanel): on phones the form is its own page, so the parent renders only
// the child. Returns that child on phones while one is open, null otherwise:
//   const childPage = useMobileChildPage();
//   if (childPage) return childPage;
// The child slides in from the right, as a screen pushed on top of the page does.
export function useMobileChildPage(): ReactNode {
  const outlet = useOutlet();
  const isDesktop = useIsDesktop();

  if (isDesktop || !outlet) return null;

  return <div className={ENTER_FROM_RIGHT_CLASS}>{outlet}</div>;
}
