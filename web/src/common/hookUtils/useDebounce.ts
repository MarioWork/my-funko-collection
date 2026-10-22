import { useEffect, useState } from 'react';

export const DEFAULT_DEBOUNCE_MS = 250;

// The value as it was DEFAULT_DEBOUNCE_MS ago with no change since; for search-as-you-type.
export function useDebounce<Value>(value: Value, delayMs = DEFAULT_DEBOUNCE_MS): Value {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);

    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
