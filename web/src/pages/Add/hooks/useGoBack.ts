import { useNavigate } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';

const PREVIOUS_PAGE = -1;
// A fresh tab or an installed app opened straight on this page has nothing behind it.
const MIN_HISTORY_WITH_PREVIOUS = 2;

// Back to where the user came from, or Home when this page was the first one opened.
export function useGoBack() {
  const navigate = useNavigate();

  return () => {
    const hasPrevious = window.history.length >= MIN_HISTORY_WITH_PREVIOUS;

    if (hasPrevious) {
      void navigate(PREVIOUS_PAGE);

      return;
    }

    void navigate(BASE_ROUTES_PATHS.HOME);
  };
}
