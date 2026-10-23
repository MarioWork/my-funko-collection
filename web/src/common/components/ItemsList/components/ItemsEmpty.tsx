import type { ReactNode } from 'react';
import EmptyState from '@components/EmptyState';
import { Button } from '@components/ui/button';

type Props = {
  // A search or a filter is on: the list is not empty, it just matched nothing.
  isFiltered: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  onClearFilters: () => void;
};

// Two empty states that must not look alike: nothing here yet, and a search or filter that found nothing.
function ItemsEmpty({ isFiltered, emptyTitle, emptyDescription, emptyAction, onClearFilters }: Props) {
  if (isFiltered) {
    return (
      <EmptyState
        pose="notFound"
        title="Nothing matches"
        description={
          <>
            Nothing matches this search or these filters.
            <br />
            Try fewer filters or another word.
          </>
        }
      >
        <Button variant="outline" onClick={onClearFilters}>
          Clear search and filters
        </Button>
      </EmptyState>
    );
  }

  return (
    <EmptyState pose="waiting" title={emptyTitle} description={emptyDescription}>
      {emptyAction}
    </EmptyState>
  );
}

export default ItemsEmpty;
