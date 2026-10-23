import type { CollectionStatsApiModel } from '@app-types/models';
import CollectionSummaryCard from '@components/CollectionSummaryCard';

type Props = {
  collections: CollectionStatsApiModel[];
};

// Grey cards inside the white section tile; hover or keyboard focus draws the teal outline. No lift: the tile already
// sets them apart from the page.
function CollectionsOverview({ collections }: Props) {
  if (collections.length === 0) return null;

  return (
    <section aria-labelledby="collections-heading" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="collections-heading" className="text-lg font-semibold">
        Collections
      </h2>
      <ul className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
        {collections.map((collection) => (
          <li key={collection.id}>
            <CollectionSummaryCard collection={collection} isCompact className="bg-muted" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CollectionsOverview;
