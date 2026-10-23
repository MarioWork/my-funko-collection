import type { ReactNode } from 'react';
import type { CollectionItemApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import { Badge } from '@components/ui/badge';
import { cn } from '@utils/classNameUtils';
import { formatIsoDate } from '@utils/dateUtils';
import { formatCents } from '@utils/moneyUtils';

type Props = {
  item: CollectionItemApiModel;
};

type TagsProps = {
  tags: CollectionItemApiModel['tags'];
};

type DetailProps = {
  label: string;
  // Takes the whole row (tags, notes) instead of one column.
  isWide?: boolean;
  children: ReactNode;
};

const NOT_SET = 'Not set';

function ItemTags({ tags }: TagsProps) {
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag.id}>
          {/* Filled, not outlined: an outline chip all but vanishes on the dark card. */}
          <Badge variant="secondary">{tag.name}</Badge>
        </li>
      ))}
    </ul>
  );
}

// One labelled value; an empty one says so, so every row reads the same.
function Detail({ label, isWide = false, children }: DetailProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', isWide && 'col-span-full')}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children ?? <span className="text-muted-foreground">{NOT_SET}</span>}</dd>
    </div>
  );
}

// Everything about the copy in one collection, shown when its row is unfolded, each value with its label.
function MembershipDetails({ item }: Props) {
  const condition = item.condition ? ITEM_CONDITION_LABELS[item.condition] : null;
  const paid = item.purchasePriceCents === null ? null : formatCents(item.purchasePriceCents, item.purchaseCurrency);
  const bought = item.purchasedAt ? formatIsoDate(item.purchasedAt) : null;
  const tags = item.tags.length > 0 ? <ItemTags tags={item.tags} /> : null;
  const notes = item.notes ? <span className="whitespace-pre-line">{item.notes}</span> : null;

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1.5 pb-1 pl-6 tabular-nums sm:grid-cols-4">
      <Detail label="Quantity">{item.quantity}</Detail>
      <Detail label="Condition">{condition}</Detail>
      <Detail label="Paid">{paid}</Detail>
      <Detail label="Bought on">{bought}</Detail>
      <Detail label="Tags" isWide>
        {tags}
      </Detail>
      <Detail label="Notes" isWide>
        {notes}
      </Detail>
    </dl>
  );
}

export default MembershipDetails;
