import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { Link } from 'react-router';
import type { CollectionApiModel, CollectionItemApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS, FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { formatIsoDate } from '@utils/dateUtils';
import { formatCents } from '@utils/moneyUtils';
import ItemRowMenu from './ItemRowMenu';
import { funkosInCategoryPath } from '@utils/funkoLinkUtils';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS, FADE_IN_CLASS } from '@utils/motionUtils';

type ItemActions = {
  busyItemId: number | undefined;
  onMove: (item: CollectionItemApiModel, toCollectionId: number) => void;
  onRemove: (item: CollectionItemApiModel) => void;
};

type Props = ItemActions & {
  items: CollectionItemApiModel[];
  collections: CollectionApiModel[];
  showCollection: boolean;
};

type ActionsCellProps = ItemActions & {
  item: CollectionItemApiModel;
  collections: CollectionApiModel[];
};

const THUMB_SIZES = '40px';
const EMPTY_VALUE = '—';

// Core features only: no sorting or filtering on the client, the API already did both for this page.
const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, CollectionItemApiModel>();

function ActionsCell({ item, collections, busyItemId, onMove, onRemove }: ActionsCellProps) {
  return (
    <ItemRowMenu
      item={item}
      collections={collections}
      editPath={COLLECTION_ROUTES_PATHS.editItem(String(item.collection.id), String(item.id))}
      isBusy={busyItemId === item.id}
      onMove={(toCollectionId) => onMove(item, toCollectionId)}
      onRemove={() => onRemove(item)}
    />
  );
}

const photoColumn = columnHelper.display({
  id: 'photo',
  header: () => <span className="sr-only">Image</span>,
  cell: ({ row }) => (
    <FunkoImage
      image={row.original.funko.primaryImage}
      alt=""
      sizes={THUMB_SIZES}
      className="aspect-3/4 w-9 rounded-md"
    />
  ),
});

const nameColumn = columnHelper.accessor((item) => item.funko.name, {
  id: 'name',
  header: 'Funko',
  cell: ({ row, getValue }) => (
    <Link
      viewTransition
      to={FUNKO_ROUTES_PATHS.detail(String(row.original.funko.id))}
      className="font-medium underline-offset-4 hover:underline"
    >
      {getValue()}
    </Link>
  ),
});

const collectionColumn = columnHelper.accessor((item) => item.collection.name, {
  id: 'collection',
  header: 'Collection',
});

const numberColumn = columnHelper.accessor((item) => item.funko.number, {
  id: 'number',
  header: 'Number',
  cell: ({ getValue }) => <span className="tabular-nums">#{getValue()}</span>,
});

const categoryColumn = columnHelper.accessor((item) => item.funko.category.name, {
  id: 'category',
  header: 'Category',
  cell: ({ row, getValue }) => (
    <Link
      viewTransition
      to={funkosInCategoryPath(row.original.funko.category.id)}
      className="underline-offset-4 hover:underline"
    >
      {getValue()}
    </Link>
  ),
});

const quantityColumn = columnHelper.accessor('quantity', {
  header: 'Qty',
  cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
});

const conditionColumn = columnHelper.accessor('condition', {
  header: 'Condition',
  cell: ({ getValue }) => {
    const condition = getValue();

    return condition ? ITEM_CONDITION_LABELS[condition] : EMPTY_VALUE;
  },
});

const priceColumn = columnHelper.display({
  id: 'price',
  header: 'Paid',
  cell: ({ row }) =>
    row.original.purchasePriceCents === null
      ? EMPTY_VALUE
      : formatCents(row.original.purchasePriceCents, row.original.purchaseCurrency),
});

const dateColumn = columnHelper.accessor('purchasedAt', {
  header: 'Bought',
  cell: ({ getValue }) => {
    const purchasedAt = getValue();

    return purchasedAt ? formatIsoDate(purchasedAt) : EMPTY_VALUE;
  },
});

const tagsColumn = columnHelper.display({
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

function buildColumns(collections: CollectionApiModel[], showCollection: boolean, actions: ItemActions) {
  const actionsColumn = columnHelper.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ActionsCell item={row.original} collections={collections} {...actions} />,
  });

  const leading = showCollection ? [photoColumn, nameColumn, collectionColumn] : [photoColumn, nameColumn];

  return columnHelper.columns([
    ...leading,
    numberColumn,
    categoryColumn,
    quantityColumn,
    conditionColumn,
    priceColumn,
    dateColumn,
    tagsColumn,
    actionsColumn,
  ]);
}

// The desktop layout of the list: a real table on TanStack's row model, sticky header.
function ItemTable({ items, collections, showCollection, busyItemId, onMove, onRemove }: Props) {
  const columns = buildColumns(collections, showCollection, { busyItemId, onMove, onRemove });
  const table = useTable({ features, columns, data: items });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={TABLE_HEADER_ROW_CLASS}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(FADE_IN_CLASS, DIMMABLE_CLASS, busyItemId === row.original.id && DIMMED_CLASS)}
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ItemTable;
