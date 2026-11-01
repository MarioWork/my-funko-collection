import { ScanBarcode } from 'lucide-react';
import { Link } from 'react-router';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';

const LABEL = 'Find by scanning a barcode';

// Beside the field: straight to the scanner, for a box in hand. The scanner is the Add flow, so a read-only user
// gets it disabled, saying why.
function ScanShortcut() {
  const readOnlyReason = useReadOnlyReason();

  if (readOnlyReason) {
    return (
      <IconButton
        variant="outline"
        aria-label={LABEL}
        className="border-input bg-card"
        disabled
        disabledReason={readOnlyReason}
      >
        <ScanBarcode aria-hidden="true" />
      </IconButton>
    );
  }

  return (
    <IconButton
      variant="outline"
      aria-label={LABEL}
      className="border-input bg-card"
      render={<Link viewTransition to={ADD_ROUTES_PATHS.BASE} />}
      nativeButton={false}
      // Base UI would announce it as a button; it navigates, so it is a link (as LinkButton does).
      role="link"
    >
      <ScanBarcode aria-hidden="true" />
    </IconButton>
  );
}

export default ScanShortcut;
