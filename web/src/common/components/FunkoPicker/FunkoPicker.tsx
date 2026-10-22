import { useState } from 'react';
import type { FunkoSummaryApiModel } from '@app-types/models';
import FunkoImage from '@components/FunkoImage';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@components/ui/combobox';
import { useFunkoSuggestions } from './hooks/useFunkoSuggestions';

type Props = {
  id?: string;
  value: FunkoSummaryApiModel | null;
  onChange: (funko: FunkoSummaryApiModel | null) => void;
  'aria-describedby'?: string;
};

const THUMB_SIZES = '32px';

// Pick a funko by typing: results show the thumbnail and number so look-alikes are told apart.
function getEmptyMessage(isLoading: boolean, query: string): string {
  if (isLoading) return 'Searching…';
  if (query) return 'No funko matches.';

  return 'Start typing to search.';
}

function FunkoPicker({ id, value, onChange, 'aria-describedby': describedBy }: Props) {
  const [query, setQuery] = useState('');
  const { funkos, isLoading } = useFunkoSuggestions(query);
  const items = value && !funkos.some((funko) => funko.id === value.id) ? [value, ...funkos] : funkos;

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(next) => onChange(next)}
      onInputValueChange={(text) => setQuery(text)}
      itemToStringLabel={(funko) => `${funko.name} #${funko.number}`}
      isItemEqualToValue={(funko, other) => funko.id === other.id}
      filter={null}
    >
      <ComboboxInput id={id} placeholder="Type a name, number or barcode…" aria-describedby={describedBy} showClear />
      <ComboboxContent>
        <ComboboxEmpty>{getEmptyMessage(isLoading, query)}</ComboboxEmpty>
        <ComboboxList>
          {(funko: FunkoSummaryApiModel) => (
            <ComboboxItem key={funko.id} value={funko}>
              <FunkoImage image={funko.primaryImage} alt="" sizes={THUMB_SIZES} className="aspect-3/4 w-6 rounded-sm" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{funko.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  #{funko.number} · {funko.category.name}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export default FunkoPicker;
