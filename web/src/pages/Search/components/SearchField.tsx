import { Search as SearchIcon, X } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@components/ui/input-group';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const INPUT_ID = 'search-everything';

// The field itself: results as you type, and a clear button once there is something to clear.
function SearchField({ value, onChange }: Props) {
  return (
    <InputGroup className="flex-1 border-input bg-card">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        id={INPUT_ID}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        aria-label="Search funkos, categories, series, collections and tags"
        placeholder="Name, number, series, barcode, box…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Clear search" onClick={() => onChange('')}>
            <X aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export default SearchField;
