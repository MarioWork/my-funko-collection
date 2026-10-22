import { useEffect, useState } from 'react';

// shadcn's sidebar switches to a sheet below this width. Tailwind's `md` breakpoint.
const MOBILE_BREAKPOINT_PX = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}
