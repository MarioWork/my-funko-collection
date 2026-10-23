import { useNavigate } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';

const PREVIOUS_PAGE = -1;
// A fresh tab or an installed app opened straight on this page has nothing behind it.
const MIN_HISTORY_WITH_PREVIOUS = 2;

// Back to where the user came from, like the browser's Back, or to `fallbackPath` (Home unless given) when this page
// was the first one opened (a shared link, a fresh tab).
export function useGoBack(fallbackPath: string = BASE_ROUTES_PATHS.HOME) {
  const navigate = useNavigate();

  return () => {
    const hasPrevious = window.history.length >= MIN_HISTORY_WITH_PREVIOUS;

    if (hasPrevious) {
      void navigate(PREVIOUS_PAGE);

      return;
    }

    void navigate(fallbackPath);
  };
}
