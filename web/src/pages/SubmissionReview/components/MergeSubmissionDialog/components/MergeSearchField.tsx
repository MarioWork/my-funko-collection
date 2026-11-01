import { Search } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@components/ui/input-group';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const ENTER_KEY = 'Enter';
const SEARCH_LABEL = 'Search the catalogue';
const SEARCH_PLACEHOLDER = 'Name, number or barcode…';

// Enter in the search box searches; it never submits the merge with whatever happens to be picked.
function keepEnterForSearch(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === ENTER_KEY) event.preventDefault();
}

// The merge dialog's search for a catalogue funko that is not a maybe-double.
function MergeSearchField({ value, onChange }: Props) {
  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={SEARCH_LABEL}
        placeholder={SEARCH_PLACEHOLDER}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={keepEnterForSearch}
      />
    </InputGroup>
  );
}

export default MergeSearchField;
