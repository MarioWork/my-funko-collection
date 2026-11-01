import { Package, ScanBarcode } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import EmptyState from '@components/EmptyState';
import LinkButton from '@components/LinkButton';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { Button } from '@components/ui/button';

type Props = {
  isFiltered: boolean;
  onClearFilters: () => void;
};

const EMPTY_TITLE = 'No funkos yet';
const EMPTY_DESCRIPTION = 'Scan a box or type the first one in.';

// Two empty states that must not look alike: a fresh catalog, and a search that found nothing.
function FunkoListEmpty({ isFiltered, onClearFilters }: Props) {
  const readOnlyReason = useReadOnlyReason();

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

  // Anyone may start it: an admin's funko joins the catalogue, a member's waits for an admin. Not a read-only user.
  return (
    <EmptyState pose="waiting" title={EMPTY_TITLE} description={EMPTY_DESCRIPTION}>
      <LinkButton to={ADD_ROUTES_PATHS.BASE} disabledReason={readOnlyReason}>
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.MANUAL} variant="outline" aria-label="New funko" disabledReason={readOnlyReason}>
        <Package data-icon="inline-start" aria-hidden="true" />
        New
      </LinkButton>
    </EmptyState>
  );
}

export default FunkoListEmpty;
