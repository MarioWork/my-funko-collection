import { ScanBarcode } from 'lucide-react';
import { Link } from 'react-router';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';

// Beside the field: straight to the scanner, for a box in hand.
function ScanShortcut() {
  return (
    <IconButton
      variant="outline"
      aria-label="Find by scanning a barcode"
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
