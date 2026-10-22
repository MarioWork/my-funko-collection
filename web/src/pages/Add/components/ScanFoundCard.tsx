import { ExternalLink, Plus, ScanBarcode } from 'lucide-react';
import type { CollectionApiModel, FunkoApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import LinkButton from '@components/LinkButton';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';

type Props = {
  funko: FunkoApiModel;
  collection: CollectionApiModel | undefined;
  isSubmitting: boolean;
  onIncrement: () => void;
  onScanAgain: () => void;
};

const THUMB_SIZES = '96px';

// A scanned box you already have in the catalog: +1 to the destination, or open it. Never a silent duplicate.
function ScanFoundCard({ funko, collection, isSubmitting, onIncrement, onScanAgain }: Props) {
  const isInDestination = collection ? funko.collections.some((candidate) => candidate.id === collection.id) : false;

  return (
    <section aria-label="Scan result" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <FunkoImage
          image={funko.primaryImage}
          alt={funko.name}
          sizes={THUMB_SIZES}
          className="aspect-3/4 w-20 rounded-lg"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-semibold">{funko.name}</h2>
          <p className="text-sm text-muted-foreground">
            #{funko.number} · {funko.category.name}
          </p>
          <div className="flex flex-wrap gap-1">
            {funko.collections.map((membership) => (
              <Badge key={membership.id} variant="secondary">
                In {membership.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {collection ? null : (
        <p className="text-sm text-muted-foreground">Already in your catalog. Pick a collection above to add a copy.</p>
      )}
      <div className="grid gap-2 @md:grid-cols-3">
        {collection ? (
          <Button onClick={onIncrement} disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" aria-hidden="true" />}
            {isInDestination ? `+1 in ${collection.name}` : `Add to ${collection.name}`}
          </Button>
        ) : null}
        <LinkButton to={FUNKO_ROUTES_PATHS.detail(String(funko.id))} variant="outline">
          <ExternalLink data-icon="inline-start" aria-hidden="true" />
          Open
        </LinkButton>
        <Button variant="ghost" onClick={onScanAgain}>
          <ScanBarcode data-icon="inline-start" aria-hidden="true" />
          Keep scanning
        </Button>
      </div>
    </section>
  );
}

export default ScanFoundCard;
