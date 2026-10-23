import { ScanBarcode } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';

// The thing done most: scan a box. Typing one in starts from the Funkos page (or the Add tab on phones).
function QuickActions() {
  return (
    <section aria-label="Quick actions" className="flex flex-wrap gap-2">
      <LinkButton to={ADD_ROUTES_PATHS.BASE}>
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
    </section>
  );
}

export default QuickActions;
