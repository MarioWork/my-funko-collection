import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import type { SuggestApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import EmptyState from '@components/EmptyState';
import FunkoImage from '@components/FunkoImage';
import { Spinner } from '@components/ui/spinner';
import {
  allFunkosPath,
  categoryPath,
  collectionPath,
  seriesPath,
  tagPath,
  type SearchGroup,
} from './searchResultsUtils';

type Props = {
  query: string;
  suggestions: SuggestApiModel | null;
  isLoading: boolean;
  // The palette closes itself when a result is chosen; the search page has nothing to close.
  onPick?: () => void;
};

type GroupProps = {
  group: SearchGroup;
  onPick?: () => void;
};

const THUMB_SIZES = '40px';
const RESULT_LINK_CLASS =
  'flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring';

function NamedGroup({ group, onPick }: GroupProps) {
  if (group.entries.length === 0) return null;

  return (
    <section aria-label={group.heading} className="flex flex-col gap-1">
      <h2 className="px-2 text-xs font-medium text-muted-foreground uppercase">{group.heading}</h2>
      <ul className="flex flex-col">
        {group.entries.map((entry) => (
          <li key={entry.id}>
            <Link to={group.toPath(entry)} onClick={onPick} className={RESULT_LINK_CLASS}>
              {entry.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type FunkoGroupProps = {
  query: string;
  funkos: SuggestApiModel['funkos'];
  onPick?: () => void;
};

// The heading carries the way into the full catalog search; the list below is only the first few hits.
function FunkoGroup({ query, funkos, onPick }: FunkoGroupProps) {
  return (
    <section aria-label="Funkos" className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 px-2">
        <h2 className="text-xs font-medium text-muted-foreground uppercase">Funkos</h2>
        <Link
          to={allFunkosPath(query)}
          onClick={onPick}
          className="flex min-h-11 items-center gap-1 rounded-md text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          All funkos matching &ldquo;{query}&rdquo;
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      {funkos.length === 0 ? <p className="px-2 py-1.5 text-sm text-muted-foreground">No funko matches here.</p> : null}
      <ul className="flex flex-col">
        {funkos.map((funko) => (
          <li key={funko.id}>
            <Link to={FUNKO_ROUTES_PATHS.detail(String(funko.id))} onClick={onPick} className={RESULT_LINK_CLASS}>
              <FunkoImage image={funko.primaryImage} alt="" sizes={THUMB_SIZES} className="aspect-3/4 w-8 rounded-sm" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{funko.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  #{funko.number} · {funko.category.name}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
