import { Download, Keyboard, ScanBarcode } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import DownloadLink from '@components/DownloadLink';
import LinkButton from '@components/LinkButton';
import exportService from '@services/exportService/exportService';

// The three things done most: scan a box, type one in, take the data with you.
function QuickActions() {
  return (
    <section aria-label="Quick actions" className="flex flex-wrap gap-2">
      <LinkButton to={ADD_ROUTES_PATHS.BASE}>
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan a barcode
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.MANUAL} variant="outline">
        <Keyboard data-icon="inline-start" aria-hidden="true" />
        Add by hand
      </LinkButton>
      <DownloadLink href={exportService.getExportJsonUrl()}>
        <Download data-icon="inline-start" aria-hidden="true" />
        Export JSON
      </DownloadLink>
    </section>
  );
}

export default QuickActions;
