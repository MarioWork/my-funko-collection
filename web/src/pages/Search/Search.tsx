import { ScanBarcode, Search as SearchIcon, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';
import SearchResults from '@components/SearchResults';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@components/ui/input-group';
import { useSuggestions } from '@hooks/useSuggestions';

const INPUT_ID = 'search-everything';

// The phone's Search tab: one big field, results as you type, a camera shortcut for "find by scanning".
function Search() {
  const [query, setQuery] = useState('');
  const { suggestions, isLoading, query: debouncedQuery } = useSuggestions(query);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Search</h1>
      <div className="flex items-center gap-2">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id={INPUT_ID}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            aria-label="Search funkos, categories, collections and tags"
            placeholder="Search everything…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton aria-label="Clear search" onClick={() => setQuery('')}>
                <X aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <IconButton
          variant="outline"
          aria-label="Find by scanning a barcode"
          render={<Link to={ADD_ROUTES_PATHS.BASE} />}
          nativeButton={false}
        >
          <ScanBarcode aria-hidden="true" />
        </IconButton>
      </div>
      <SearchResults query={debouncedQuery} suggestions={suggestions} isLoading={isLoading} />
    </div>
  );
}

export default Search;
