import { Link } from 'react-router';
import type { CollectionStatsApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Badge } from '@components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { formatCents } from '@utils/moneyUtils';

type Props = {
  collections: CollectionStatsApiModel[];
};

type CollectionTileProps = {
  collection: CollectionStatsApiModel;
};

function CollectionTile({ collection }: CollectionTileProps) {
  return (
    <li>
      <Card
        size="sm"
        className="relative h-full transition-[transform,box-shadow,border-color] duration-200 focus-within:border-primary/40 hover:border-primary/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
      >
        <CardHeader>
          <CardTitle>
            <Link
              to={COLLECTION_ROUTES_PATHS.detail(String(collection.id))}
              className="outline-none after:absolute after:inset-0 after:rounded-xl"
            >
              {collection.name}
            </Link>
            {collection.isDefault ? <Badge className="ml-2 align-middle">Default</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
          <span>
            <strong>{collection.itemCount}</strong> funkos
          </span>
          <span>
            <strong>{collection.totalQuantity}</strong> pieces
          </span>
          <span>
            <strong>{formatCents(collection.totalSpentCents)}</strong> spent
          </span>
        </CardContent>
      </Card>
    </li>
  );
}

function CollectionsOverview({ collections }: Props) {
  if (collections.length === 0) return null;

  return (
    <section aria-labelledby="collections-heading" className="flex flex-col gap-3">
      <h2 id="collections-heading" className="text-lg font-semibold">
        Collections
      </h2>
      <ul className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionTile key={collection.id} collection={collection} />
        ))}
      </ul>
    </section>
  );
}

export default CollectionsOverview;
