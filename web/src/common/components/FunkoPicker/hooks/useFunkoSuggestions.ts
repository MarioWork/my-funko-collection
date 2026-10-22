import type { FunkoSummaryApiModel } from '@app-types/models';
import { useSuggestions } from '@hooks/useSuggestions';

const NO_FUNKOS: FunkoSummaryApiModel[] = [];

// The funkos group of /suggest, for the picker's combobox.
export function useFunkoSuggestions(query: string) {
  const { suggestions, isLoading } = useSuggestions(query);

  return { funkos: suggestions?.funkos ?? NO_FUNKOS, isLoading };
}
