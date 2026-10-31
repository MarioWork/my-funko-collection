import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';

type Props = {
  barcode: string;
  onScanAnother: () => void;
};

const NOT_IN_CATALOGUE = 'This funko is not in the catalogue yet.';
const ADMIN_ADDS_FUNKOS = 'Only an admin can add a new funko. Ask them to add it, then scan it again.';

// What a member sees instead of the New funko form: only an admin adds funkos to the shared catalogue.
function AdminOnlyNotice({ barcode, onScanAnother }: Props) {
  const lead = barcode ? `${NOT_IN_CATALOGUE} (barcode ${barcode})` : NOT_IN_CATALOGUE;

  return (
    <>
      <InlineAlert tone="info">
        {lead} {ADMIN_ADDS_FUNKOS}
      </InlineAlert>
      <Button variant="outline" className="self-start" onClick={onScanAnother}>
        Scan another
      </Button>
    </>
  );
}

export default AdminOnlyNotice;
