import { Pencil, Trash2 } from 'lucide-react';
import type { CollectionItemApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
import { Spinner } from '@components/ui/spinner';
import { useItemActions } from '@hooks/useItemActions';
import { cn } from '@utils/classNameUtils';
import { formatIsoDate } from '@utils/dateUtils';
import { formatCents } from '@utils/moneyUtils';

type Props = {
  items: CollectionItemApiModel[];
};

type CardProps = {
  item: CollectionItemApiModel;
  isBusy: boolean;
  onRemove: (item: CollectionItemApiModel) => void;
};

type Fact = { label: string; value: React.ReactNode };

const NOT_SET = '—';
const ISO_DATE_LENGTH = 10;

function TagBadges({ tags }: { tags: CollectionItemApiModel['tags'] }) {
  if (tags.length === 0) return <>{NOT_SET}</>;

  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="outline">
          {tag.name}
        </Badge>
      ))}
    </span>
  );
}

// One card per collection the funko is in: the copy's facts, its notes, then Edit and Remove (undoable).
function MembershipCard({ item, isBusy, onRemove }: CardProps) {
  const facts: Fact[] = [
    { label: 'Quantity', value: `×${item.quantity}` },
    { label: 'Condition', value: item.condition ? ITEM_CONDITION_LABELS[item.condition] : NOT_SET },
    {
      label: 'Paid',
      value: item.purchasePriceCents === null ? NOT_SET : formatCents(item.purchasePriceCents, item.purchaseCurrency),
    },
    { label: 'Bought', value: item.purchasedAt ? formatIsoDate(item.purchasedAt) : NOT_SET },
    { label: 'Added', value: formatIsoDate(item.createdAt.slice(0, ISO_DATE_LENGTH)) },
    { label: 'Tags', value: <TagBadges tags={item.tags} /> },
  ];

  return (
    <li>
      <Card size="sm" className={cn('h-full', isBusy && 'opacity-60')}>
        <CardHeader>
          <CardTitle>{item.collection.name}</CardTitle>
          <CardDescription>
            {item.quantity === 1 ? 'One copy in this collection' : `${item.quantity} copies in this collection`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm @md:grid-cols-3">
            {facts.map(({ label, value }) => (
              <div key={label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className={cn('tabular-nums', typeof value === 'string' && 'truncate')}>{value}</dd>
              </div>
            ))}
            {item.notes ? (
              <div className="col-span-full flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd>{item.notes}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" size="sm" disabled={isBusy} onClick={() => onRemove(item)}>
            {isBusy ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" aria-hidden="true" />}
            Remove from {item.collection.name}
          </Button>
          <LinkButton
            to={COLLECTION_ROUTES_PATHS.editItem(String(item.collection.id), String(item.id))}
            variant="outline"
            size="sm"
          >
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Edit
          </LinkButton>
        </CardFooter>
      </Card>
    </li>
  );
}

// The collections this funko sits in, one card each under one heading; removal is undoable from the toast.
function FunkoMemberships({ items }: Props) {
  const { busyItemId, remove } = useItemActions();

  return (
    <section aria-labelledby="memberships-heading" className="flex flex-col gap-3">
      <h2 id="memberships-heading" className="text-lg font-semibold">
        Collections
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Not in any collection yet. Use the buttons above to add it.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <MembershipCard key={item.id} item={item} isBusy={busyItemId === item.id} onRemove={remove} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default FunkoMemberships;
