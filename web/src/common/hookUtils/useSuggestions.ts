import { useEffect, useState } from 'react';
import type { SuggestApiModel } from '@app-types/models';
import { useDebounce } from '@hooks/useDebounce';
import suggestService from '@services/suggestService/suggestService';

type Answer = {
  query: string;
  suggestions: SuggestApiModel | null;
};

const MIN_QUERY_LENGTH = 1;
const NO_ANSWER: Answer = { query: '', suggestions: null };

// Type-ahead over /suggest for the search tab, the palette and the funko picker. A read outside a loader on
// purpose: it follows keystrokes, not the URL. Loading is derived: the answer on hand is for an older query.
export function useSuggestions(query: string) {
  const debounced = useDebounce(query).trim();
  const [answer, setAnswer] = useState<Answer>(NO_ANSWER);
  const isQueryLongEnough = debounced.length >= MIN_QUERY_LENGTH;
  const isLoading = isQueryLongEnough && answer.query !== debounced;

  useEffect(() => {
    let isStale = false;

    if (!isQueryLongEnough) return undefined;

    suggestService
      .getSuggestions(debounced)
      .then((suggestions) => {
        if (!isStale) setAnswer({ query: debounced, suggestions });
      })
      .catch(() => {
        if (!isStale) setAnswer({ query: debounced, suggestions: null });
      });

    return () => {
      isStale = true;
    };
  }, [debounced, isQueryLongEnough]);

  return { suggestions: isQueryLongEnough ? answer.suggestions : null, isLoading, query: debounced };
}
