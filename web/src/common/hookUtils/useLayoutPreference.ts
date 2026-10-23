import { useLocalStorage } from '@hooks/useLocalStorage';
import { DEFAULT_FUNKO_LAYOUT, LAYOUT_DENSITY_MAP, type FunkoLayoutUtil } from '@utils/layoutUtils';

// The layout a list was last shown in, kept on this device under its own key. A stale or hand-edited value falls
// back to the large grid.
export function useLayoutPreference(storageKey: string) {
  const [storedLayout, setLayout] = useLocalStorage<FunkoLayoutUtil>(storageKey, DEFAULT_FUNKO_LAYOUT);
  const layout = storedLayout in LAYOUT_DENSITY_MAP ? storedLayout : DEFAULT_FUNKO_LAYOUT;

  return { layout, density: LAYOUT_DENSITY_MAP[layout], setLayout };
}
