import { PAGE_ICONS } from '@utils/navigationUtils';
import { useState } from 'react';
import EmptyState from '@components/EmptyState';
import PageHeader from '@components/PageHeader';
import SearchResults from '@components/SearchResults';
import { useSuggestions } from '@hooks/useSuggestions';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS } from '@utils/motionUtils';
import ScanShortcut from './components/ScanShortcut';
import SearchField from './components/SearchField';

// The phone's Search tab, laid out like the other pages: the header tile holds the field (results as you type) and a
// scan shortcut; the results sit in one white tile below.
function Search() {
  const [query, setQuery] = useState('');
  const { suggestions, isLoading, query: debouncedQuery } = useSuggestions(query);
  const hasQuery = debouncedQuery.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.SEARCH}
        title="Search"
        description="Funkos, categories, series, collections and tags, all at once."
      >
        <div className="flex items-center gap-2">
          <SearchField value={query} onChange={setQuery} />
          <ScanShortcut />
        </div>
      </PageHeader>
      <div className={cn('rounded-xl border bg-card p-4', DIMMABLE_CLASS, isLoading && hasQuery && DIMMED_CLASS)}>
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
