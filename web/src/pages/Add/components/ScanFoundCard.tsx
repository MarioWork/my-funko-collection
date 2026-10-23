import { ExternalLink, Plus, ScanBarcode } from 'lucide-react';
import type { CollectionApiModel, CollectionId, FunkoApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import CollectionPicker from '@components/CollectionPicker';
import FunkoImage from '@components/FunkoImage';
import InlineAlert from '@components/InlineAlert';
import LinkButton from '@components/LinkButton';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import DisabledReason from '@components/DisabledReason';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  funko: FunkoApiModel;
  collections: CollectionApiModel[];
  selectedCollectionIds: CollectionId[];
  isSubmitting: boolean;
  errorMessage?: string;
  onCollectionsChange: (collectionIds: CollectionId[]) => void;
  onIncrement: () => void;
  onScanAnother: () => void;
};

const THUMB_SIZES = '96px';
const COLLECTIONS_ID = 'scan-found-collections';

function incrementLabel(funko: FunkoApiModel, selected: CollectionApiModel[]): string {
  const names = selected.map((collection) => collection.name).join(', ');
  const isInEveryList = selected.every((collection) =>
    funko.collections.some((membership) => membership.id === collection.id),
  );

  return isInEveryList ? `+1 in ${names}` : `Add to ${names}`;
}

// A scanned box already in the catalog: +1 in the picked collections, or open it. Never a silent duplicate.
function ScanFoundCard({
  funko,
  collections,
  selectedCollectionIds,
  isSubmitting,
  errorMessage,
  onCollectionsChange,
  onIncrement,
  onScanAnother,
}: Props) {
  const selected = collections.filter((collection) => selectedCollectionIds.includes(collection.id));
  const hasSelection = selected.length > 0;

  return (
    <section aria-label="Scan result" className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-4">
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
      <CollectionPicker
        id={COLLECTIONS_ID}
        label="Save to collections"
        collections={collections}
        value={selectedCollectionIds}
        onChange={onCollectionsChange}
      />
      {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
      <div className="grid gap-2 @md:grid-cols-3">
        {hasSelection ? (
          <DisabledReason reason={reasonWhen(isSubmitting, DISABLED_REASONS.SAVING)}>
            <Button onClick={onIncrement} disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Plus data-icon="inline-start" aria-hidden="true" />
              )}
              {incrementLabel(funko, selected)}
            </Button>
          </DisabledReason>
        ) : null}
        <LinkButton to={FUNKO_ROUTES_PATHS.detail(String(funko.id))} variant="outline">
          <ExternalLink data-icon="inline-start" aria-hidden="true" />
          Open
        </LinkButton>
        <Button variant="ghost" onClick={onScanAnother}>
          <ScanBarcode data-icon="inline-start" aria-hidden="true" />
          Scan another
        </Button>
      </div>
    </section>
  );
}

export default ScanFoundCard;
