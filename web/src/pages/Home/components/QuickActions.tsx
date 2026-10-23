import { PackagePlus, ScanBarcode } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';

// The two things done most: scan a box, or type one in. Exports live in Settings → Data and on each collection.
function QuickActions() {
  return (
    <section aria-label="Quick actions" className="flex flex-wrap gap-2">
      <LinkButton to={ADD_ROUTES_PATHS.NESTED_SCAN}>
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.NESTED_FORM} variant="outline">
        <PackagePlus data-icon="inline-start" aria-hidden="true" />
        Add
      </LinkButton>
    </section>
  );
}

export default QuickActions;
