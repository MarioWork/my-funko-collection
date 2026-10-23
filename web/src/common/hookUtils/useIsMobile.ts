import { useMediaQuery } from '@hooks/useMediaQuery';

// shadcn's sidebar switches to a sheet below this width. Tailwind's `md` breakpoint.
const MOBILE_BREAKPOINT_PX = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
