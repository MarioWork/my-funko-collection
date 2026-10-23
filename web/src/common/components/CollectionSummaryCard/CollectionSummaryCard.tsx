import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { CollectionStatsApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Badge } from '@components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { cn } from '@utils/classNameUtils';
import { formatCents } from '@utils/moneyUtils';

type Props = {
  // The collection's name, default flag and totals: a full collection or its row in the stats.
  collection: CollectionStatsApiModel;
  // Under the name, e.g. the collection's notes.
  description?: ReactNode;
  // The ⋯ menu, top right, above the card-wide link.
  menu?: ReactNode;
  // The smaller card (Home's overview): tighter spacing, and the counts wrap.
  isCompact?: boolean;
  className?: string;
};

// The app's card hover (primary outline, no lift, no background change), shown for keyboard focus too.
const HOVER_CLASS =
  'relative h-full transition-shadow duration-200 focus-within:ring-2 focus-within:ring-primary hover:ring-2 hover:ring-primary';

// One collection as a card: its name links the whole card to its items, then the counts and the total.
function CollectionSummaryCard({ collection, description, menu, isCompact = false, className }: Props) {
  return (
    <Card size={isCompact ? 'sm' : 'default'} className={cn(HOVER_CLASS, className)}>
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
        {description ? <CardDescription>{description}</CardDescription> : null}
        {menu ? <CardAction className="relative z-10">{menu}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn('flex text-sm tabular-nums', isCompact ? 'flex-wrap gap-x-4 gap-y-1' : 'gap-4')}>
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

export default CollectionSummaryCard;
