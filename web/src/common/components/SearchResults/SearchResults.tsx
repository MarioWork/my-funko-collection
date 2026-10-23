import type { SuggestApiModel } from '@app-types/models';
import EmptyState from '@components/EmptyState';
import { Spinner } from '@components/ui/spinner';
import FunkoGroup from './components/FunkoGroup';
import NamedGroup from './components/NamedGroup';
import { categoryPath, collectionPath, seriesPath, tagPath, type SearchGroup } from './searchResultsUtils';

type Props = {
  query: string;
  suggestions: SuggestApiModel | null;
  isLoading: boolean;
  // The palette closes itself when a result is chosen; the search page has nothing to close.
  onPick?: () => void;
};

const countHits = (suggestions: SuggestApiModel) =>
  suggestions.funkos.length +
  suggestions.categories.length +
  suggestions.series.length +
  suggestions.collections.length +
  suggestions.tags.length;

// Hits from /suggest grouped Funkos / Categories / Collections / Tags, plus "all results" into the catalog search.
function SearchResults({ query, suggestions, isLoading, onPick }: Props) {
  if (!query) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">Type a name, a number, a barcode, a box…</p>
    );
  }

  if (isLoading && !suggestions) {
    return (
      <p role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Spinner /> Searching…
      </p>
    );
  }

  if (!suggestions || countHits(suggestions) === 0) {
    return (
      <div role="status">
        <EmptyState
          pose="notFound"
          title="Nothing found"
          description={
            <>
              Nothing matches “{query}”.
              <br />
              Try another word, a number or a barcode.
            </>
          }
        />
      </div>
    );
  }

  const namedGroups: SearchGroup[] = [
    { heading: 'Categories', entries: suggestions.categories, toPath: categoryPath },
    { heading: 'Series', entries: suggestions.series, toPath: seriesPath },
    { heading: 'Collections', entries: suggestions.collections, toPath: collectionPath },
    { heading: 'Tags', entries: suggestions.tags, toPath: tagPath },
  ];

  return (
    <div className="flex flex-col gap-4" aria-busy={isLoading}>
      <FunkoGroup query={query} funkos={suggestions.funkos} onPick={onPick} />
      {namedGroups.map((group) => (
        <NamedGroup key={group.heading} group={group} onPick={onPick} />
      ))}
    </div>
  );
}

export default SearchResults;
