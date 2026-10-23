import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import { Badge } from '@components/ui/badge';
import { formatIsoDate } from '@utils/dateUtils';
import { formatCents } from '@utils/moneyUtils';
import { itemColumnHelper } from './itemTableColumnHelper';

// What an empty cell shows.
const EMPTY_VALUE = '—';

// The copy's own facts: how many, condition, price, date bought, tags.
export const quantityColumn = itemColumnHelper.accessor('quantity', {
  header: 'Qty',
  cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
});

export const conditionColumn = itemColumnHelper.accessor('condition', {
  header: 'Condition',
  cell: ({ getValue }) => {
    const condition = getValue();

    return condition ? ITEM_CONDITION_LABELS[condition] : EMPTY_VALUE;
  },
});

export const priceColumn = itemColumnHelper.display({
  id: 'price',
  header: 'Paid',
  cell: ({ row }) =>
    row.original.purchasePriceCents === null
      ? EMPTY_VALUE
      : formatCents(row.original.purchasePriceCents, row.original.purchaseCurrency),
});

export const dateColumn = itemColumnHelper.accessor('purchasedAt', {
  header: 'Bought',
  cell: ({ getValue }) => {
    const purchasedAt = getValue();

    return purchasedAt ? formatIsoDate(purchasedAt) : EMPTY_VALUE;
  },
});

export const tagsColumn = itemColumnHelper.display({
  id: 'tags',
  header: 'Tags',
  cell: ({ row }) => (
    <span className="flex flex-wrap gap-1">
      {row.original.tags.map((tag) => (
        <Badge key={tag.id} variant="outline">
          {tag.name}
        </Badge>
      ))}
    </span>
  ),
});
