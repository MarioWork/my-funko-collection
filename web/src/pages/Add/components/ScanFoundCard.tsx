import { ExternalLink, ScanBarcode } from 'lucide-react';
import type { CollectionApiModel, CollectionId, FunkoApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import CollectionPicker from '@components/CollectionPicker';
import InlineAlert from '@components/InlineAlert';
import LinkButton from '@components/LinkButton';
import { Button } from '@components/ui/button';
import IncrementButton from './IncrementButton';
import ScanFoundSummary from './ScanFoundSummary';

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
      <ScanFoundSummary funko={funko} />
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
          <IncrementButton
            label={incrementLabel(funko, selected)}
            isSubmitting={isSubmitting}
            onIncrement={onIncrement}
          />
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
