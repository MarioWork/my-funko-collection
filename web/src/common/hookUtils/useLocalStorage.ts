import { useSyncExternalStore } from 'react';

// A stored value and its setter, shaped like useState's.
export type LocalStorageState<Value extends string> = [Value, (value: Value) => void];

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// A per-browser preference (view mode, density, last-used collection). Never for data the server should hold.
export function useLocalStorage<Value extends string>(key: string, fallback: Value): LocalStorageState<Value> {
  const stored = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      window.addEventListener('storage', onChange);

      return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    () => read(key),
    () => null,
  );

  const setValue = (value: Value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Blocked storage: the preference lives for this page only.
    }

    notify();
  };

  return [(stored as Value | null) ?? fallback, setValue];
}
