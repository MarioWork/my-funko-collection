import { ExternalLink, ScanBarcode } from 'lucide-react';
import type { FunkoApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';
import PhotoUploader from '@components/PhotoUploader';
import { Button } from '@components/ui/button';

type Props = {
  funko: FunkoApiModel;
  collectionName: string | undefined;
  onScanAgain: () => void;
};

// Just created: photos go straight onto the new funko, then back to the viewfinder for the next box.
function AddedCard({ funko, collectionName, onScanAgain }: Props) {
  return (
    <section aria-label="Added" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold">
          {funko.name} <span className="text-muted-foreground">#{funko.number}</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          {collectionName ? `Added to ${collectionName}.` : 'Added to the catalog.'} Photos?
        </p>
      </div>
      <PhotoUploader actionPath={FUNKO_ROUTES_PATHS.images(String(funko.id))} />
      <div className="grid gap-2 @md:grid-cols-2">
        <Button onClick={onScanAgain}>
          <ScanBarcode data-icon="inline-start" aria-hidden="true" />
          Scan the next one
        </Button>
        <LinkButton to={FUNKO_ROUTES_PATHS.detail(String(funko.id))} variant="outline">
          <ExternalLink data-icon="inline-start" aria-hidden="true" />
          Open {funko.name}
        </LinkButton>
      </div>
    </section>
  );
}

export default AddedCard;
