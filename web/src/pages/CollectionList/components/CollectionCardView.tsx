import { Link } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Badge } from '@components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { formatCents } from '@utils/moneyUtils';
import { COLLECTION_HOVER_CLASS } from './collectionCardUtils';

type Props = {
  collection: CollectionApiModel;
  menu: React.ReactNode;
};

// The card layout: name and default badge, notes, then the counts and the total.
function CollectionCardView({ collection, menu }: Props) {
  return (
    <Card className={COLLECTION_HOVER_CLASS}>
      <CardHeader>
        <CardTitle>
          <Link
            viewTransition
            to={COLLECTION_ROUTES_PATHS.detail(String(collection.id))}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {collection.name}
          </Link>
          {collection.isDefault ? <Badge className="ml-2 align-middle">Default</Badge> : null}
        </CardTitle>
        <CardDescription>{collection.notes ?? 'No notes'}</CardDescription>
        <CardAction className="relative z-10">{menu}</CardAction>
      </CardHeader>
      <CardContent className="flex gap-4 text-sm tabular-nums">
        <span>
          <strong>{collection.itemCount}</strong> funkos
        </span>
        <span>
          <strong>{collection.totalQuantity}</strong> pieces
        </span>
        <span>
          <strong>{formatCents(collection.totalSpentCents)}</strong> total
        </span>
      </CardContent>
    </Card>
  );
}

export default CollectionCardView;
