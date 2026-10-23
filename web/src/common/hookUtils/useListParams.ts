import { useSearchParams } from 'react-router';
import { ApiUrlParamsUtil } from '@app-types/utility';

export type ParamUpdates = Record<string, string | undefined | null>;

// One place that reads and writes list state in the URL (page, q, filters, sort), so the loader re-runs and the
// page is linkable. Changing anything but the page resets the page, as a filter change should. A change made with a
// click (sort, filter, page) cross-fades the old results into the new ones (a view transition); typing in the
// search box does not, as it would freeze what you type for the length of the fade.
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = (key: string): string | undefined => searchParams.get(key) ?? undefined;

  const setParams = (updates: ParamUpdates, { isPageChange = false, isTyping = false } = {}) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(updates)) {
      const isEmpty = value === undefined || value === null || value === '';

      if (isEmpty) next.delete(key);
      else next.set(key, value);
    }

    if (!isPageChange) next.delete(ApiUrlParamsUtil.page);

    setSearchParams(next, { replace: true, viewTransition: !isTyping });
  };

  const clearParams = (keys: string[]) => setParams(Object.fromEntries(keys.map((key) => [key, undefined])));

  return { searchParams, getParam, setParams, clearParams };
}
