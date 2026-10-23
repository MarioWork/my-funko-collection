import { Package, PackagePlus, ScanBarcode } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import EmptyState from '@components/EmptyState';
import LinkButton from '@components/LinkButton';
import { Button } from '@components/ui/button';

type Props = {
  isFiltered: boolean;
  onClearFilters: () => void;
};

// Two empty states that must not look alike: a fresh catalog, and a search that found nothing.
function FunkoListEmpty({ isFiltered, onClearFilters }: Props) {
  if (isFiltered) {
    return (
      <EmptyState icon={Package} title="Nothing matches" description="Try fewer filters or another word.">
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      </EmptyState>
    );
  }

  return (
    <EmptyState icon={Package} title="No funkos yet" description="Scan a box or type the first one in.">
      <LinkButton to={ADD_ROUTES_PATHS.NESTED_SCAN}>
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.NESTED_FORM} variant="outline">
        <PackagePlus data-icon="inline-start" aria-hidden="true" />
        Add
      </LinkButton>
    </EmptyState>
  );
}

export default FunkoListEmpty;
