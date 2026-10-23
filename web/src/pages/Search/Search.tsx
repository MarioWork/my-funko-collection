import { ScanBarcode, Search as SearchIcon, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import EmptyState from '@components/EmptyState';
import IconButton from '@components/IconButton';
import PageHeader from '@components/PageHeader';
import SearchResults from '@components/SearchResults';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@components/ui/input-group';
import { useSuggestions } from '@hooks/useSuggestions';

const INPUT_ID = 'search-everything';

// The phone's Search tab, laid out like the other pages: the header tile holds the field (results as you type) and a
// scan shortcut; the results sit in one white tile below.
function Search() {
  const [query, setQuery] = useState('');
  const { suggestions, isLoading, query: debouncedQuery } = useSuggestions(query);
  const hasQuery = debouncedQuery.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Search" description="Funkos, categories, series, collections and tags, all at once.">
        <div className="flex items-center gap-2">
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
            className="border-input bg-card"
            render={<Link to={ADD_ROUTES_PATHS.BASE} />}
            nativeButton={false}
            // Base UI would announce it as a button; it navigates, so it is a link (as LinkButton does).
            role="link"
          >
            <ScanBarcode aria-hidden="true" />
          </IconButton>
        </div>
      </PageHeader>
      <div className="rounded-xl border bg-card p-4">
        {hasQuery ? (
          <SearchResults query={debouncedQuery} suggestions={suggestions} isLoading={isLoading} />
        ) : (
          <EmptyState
            pose="searching"
            title="Search everything"
            description="Type a name, a number, a barcode or a box like “Box 3”. Results show as you type."
          />
        )}
      </div>
    </div>
  );
}

export default Search;
