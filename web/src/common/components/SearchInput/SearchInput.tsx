import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@components/ui/input-group';
import { useDebounce } from '@hooks/useDebounce';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
};

// Type-ahead search: the text is debounced before it reaches the URL (and the loader); Enter commits at once.
function SearchInput({ value, onChange, placeholder = 'Search…', label, className }: Props) {
  const [draft, setDraft] = useState(value);
  const [echoedValue, setEchoedValue] = useState(value);
  const debounced = useDebounce(draft);

  // The URL changed from outside (back button, a chip, "Clear all"): adopt it. Derived during render, no effect.
  if (value !== echoedValue) {
    setEchoedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // `value` is the URL echo of what this input sent; only a new debounced draft should write to the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const clear = () => {
    setDraft('');
    onChange('');
  };

  return (
    <InputGroup className={className}>
      <InputGroupAddon align="inline-start">
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onChange(draft);
        }}
        enterKeyHint="search"
        // type="search" brings the browser's own clear button; the Clear search button below replaces it.
        className="[&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="ghost" size="icon-sm" aria-label="Clear search" onClick={clear}>
            <X aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export default SearchInput;
