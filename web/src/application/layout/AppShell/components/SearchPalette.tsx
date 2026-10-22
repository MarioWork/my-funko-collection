import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import SearchResults from '@components/SearchResults';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@components/ui/input-group';
import { Kbd } from '@components/ui/kbd';
import { useSuggestions } from '@hooks/useSuggestions';

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// Desktop ⌘K: a dialog with the same grouped results as the Search tab. Remounts per open, so the query resets.
function SearchPalette({ isOpen, onOpenChange }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] translate-y-0 gap-3 p-3 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Funkos, categories, collections and tags.</DialogDescription>
        </DialogHeader>
        {isOpen ? <PaletteBody onPick={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PaletteBody({ onPick }: { onPick: () => void }) {
  const [query, setQuery] = useState('');
  const { suggestions, isLoading, query: debouncedQuery } = useSuggestions(query);

  return (
    <>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          inputMode="search"
          aria-label="Search funkos, categories, collections and tags"
          placeholder="Search everything…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <Kbd>Esc</Kbd>
        </InputGroupAddon>
      </InputGroup>
      <div className="max-h-[60vh] overflow-y-auto">
        <SearchResults query={debouncedQuery} suggestions={suggestions} isLoading={isLoading} onPick={onPick} />
      </div>
    </>
  );
}

export default SearchPalette;
