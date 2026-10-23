import type { CollectionItemApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import { Badge } from '@components/ui/badge';
import { useItemActions } from '@hooks/useItemActions';
import MembershipActions from './MembershipActions';
import { formatIsoDate } from '@utils/dateUtils';
import { formatCents } from '@utils/moneyUtils';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS, FADE_IN_CLASS } from '@utils/motionUtils';

type Props = {
  items: CollectionItemApiModel[];
};

type RowProps = {
  item: CollectionItemApiModel;
  isBusy: boolean;
  onRemove: (item: CollectionItemApiModel) => void;
};

type TagsProps = {
  tags: CollectionItemApiModel['tags'];
};

// "1 copy · Out of box · Paid 9,99 € · Bought 11/11/2023": only the facts that are set.
function factsLine(item: CollectionItemApiModel): string {
  const copies = item.quantity === 1 ? '1 copy' : `${item.quantity} copies`;
  const condition = item.condition ? ITEM_CONDITION_LABELS[item.condition] : null;
  const paid =
    item.purchasePriceCents === null ? null : `Paid ${formatCents(item.purchasePriceCents, item.purchaseCurrency)}`;
  const bought = item.purchasedAt ? `Bought ${formatIsoDate(item.purchasedAt)}` : null;

  return [copies, condition, paid, bought].filter((fact): fact is string => fact !== null).join(' · ');
}

function ItemTags({ tags }: TagsProps) {
  return (
    <ul className="flex flex-wrap gap-1 pt-0.5" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag.id}>
          {/* Filled, not outlined: an outline chip all but vanishes on the dark card. */}
          <Badge variant="secondary">{tag.name}</Badge>
        </li>
      ))}
    </ul>
  );
}

// One collection the funko is in: its name and ⋯, then one line of facts, then its tags when set. Notes stay in the
// item's Edit sheet, so the box stays a quick overview.
function MembershipRow({ item, isBusy, onRemove }: RowProps) {
  return (
    <li
      className={cn(
        'flex flex-col gap-1 py-3 first:pt-0 last:pb-0',
        FADE_IN_CLASS,
        DIMMABLE_CLASS,
        isBusy && DIMMED_CLASS,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate font-medium">{item.collection.name}</h3>
        <MembershipActions item={item} isBusy={isBusy} onRemove={onRemove} />
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">{factsLine(item)}</p>
      {item.tags.length > 0 ? <ItemTags tags={item.tags} /> : null}
    </li>
  );
}

// The collections this funko sits in: one tile, a compact row per collection divided by hairlines. Removal is
// undoable from the toast. It may shrink (min-h-0): beside the gallery it fills what is left of the screen and its
// list scrolls inside it instead of the page.
function FunkoMemberships({ items }: Props) {
  const { busyItemId, remove } = useItemActions();

  return (
    <section
      aria-labelledby="memberships-heading"
      className="flex min-h-0 flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <h2 id="memberships-heading" className="text-lg font-semibold">
        Collections
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not in any collection yet. Use the icons by the name to add it.</p>
      ) : (
        <ul className="-mr-3 -ml-1 flex min-h-0 flex-col divide-y overflow-y-auto pr-3 pl-1">
          {items.map((item) => (
            <MembershipRow key={item.id} item={item} isBusy={busyItemId === item.id} onRemove={remove} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default FunkoMemberships;
