import { Package, ScanBarcode } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import EmptyState from '@components/EmptyState';
import LinkButton from '@components/LinkButton';
import { Button } from '@components/ui/button';
import { useIsAdmin } from '@hooks/useIsAdmin';

type Props = {
  isFiltered: boolean;
  onClearFilters: () => void;
};

const EMPTY_TITLE = 'No funkos yet';
const MEMBER_EMPTY_DESCRIPTION = 'An admin adds the funkos; they show up here.';

// Two empty states that must not look alike: a fresh catalog, and a search that found nothing.
function FunkoListEmpty({ isFiltered, onClearFilters }: Props) {
  const isAdmin = useIsAdmin();

  if (isFiltered) {
    return (
      <EmptyState
        pose="notFound"
        title="Nothing matches"
        description={
          <>
            Nothing matches these filters or words.
            <br />
            Try fewer filters or another word.
          </>
        }
      >
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      </EmptyState>
    );
  }

  // Only an admin adds funkos, so a member's empty catalogue has nothing to start.
  if (!isAdmin) {
    return <EmptyState pose="waiting" title={EMPTY_TITLE} description={MEMBER_EMPTY_DESCRIPTION} />;
  }

  return (
    <EmptyState pose="waiting" title={EMPTY_TITLE} description="Scan a box or type the first one in.">
      <LinkButton to={ADD_ROUTES_PATHS.BASE}>
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.MANUAL} variant="outline" aria-label="New funko">
        <Package data-icon="inline-start" aria-hidden="true" />
        New
      </LinkButton>
    </EmptyState>
  );
}

export default FunkoListEmpty;
