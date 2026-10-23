import { useSearchParams } from 'react-router';
import { ApiUrlParamsUtil } from '@app-types/utility';

export type ParamUpdates = Record<string, string | undefined | null>;

type SetParamsOptions = {
  // A pager click: keeps the new page instead of going back to the first.
  isPageChange?: boolean;
  // A keystroke in the search box: applied at once, never animated.
  isTyping?: boolean;
};

// One place that reads and writes list state in the URL (page, q, filters, sort), so the loader re-runs and the
// page is linkable. Changing anything but the page resets the page, as a filter change should. A change made with a
// click (sort, filter, page) lands in a React transition, so the results and chips animate through their
// <ViewTransition>s; typing in the search box is flushed at once instead (flushSync), as a fade would freeze what
// you type for its length. (React Router's own `viewTransition` option is deprecated, and running it beside React's
// view transitions made one of them abort.)
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = (key: string): string | undefined => searchParams.get(key) ?? undefined;

  const setParams = (updates: ParamUpdates, { isPageChange = false, isTyping = false }: SetParamsOptions = {}) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(updates)) {
      const isEmpty = value === undefined || value === null || value === '';

      if (isEmpty) next.delete(key);
      else next.set(key, value);
    }

    if (!isPageChange) next.delete(ApiUrlParamsUtil.page);

    setSearchParams(next, { replace: true, flushSync: isTyping });
  };

  const clearParams = (keys: string[]) => setParams(Object.fromEntries(keys.map((key) => [key, undefined])));

  return { searchParams, getParam, setParams, clearParams };
}
