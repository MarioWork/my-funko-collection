import { Link } from 'react-router';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { cn } from '@utils/classNameUtils';
import { LINK_FOCUS_CLASS } from '@utils/focusUtils';
import { funkosInCategoryPath } from '@utils/funkoLinkUtils';
import { itemColumnHelper } from './itemTableColumnHelper';
import { conditionColumn, dateColumn, priceColumn, quantityColumn, tagsColumn } from './itemTableDetailColumns';
import ItemRowMenu from './ItemRowMenu';

const THUMB_SIZES = '40px';

const photoColumn = itemColumnHelper.display({
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

const nameColumn = itemColumnHelper.accessor((item) => item.funko.name, {
  id: 'name',
  header: 'Funko',
  cell: ({ row, getValue }) => (
    <Link
      viewTransition
      to={FUNKO_ROUTES_PATHS.detail(String(row.original.funko.id))}
      className={cn('font-medium underline-offset-4 hover:underline', LINK_FOCUS_CLASS)}
    >
      {getValue()}
    </Link>
  ),
});

const collectionColumn = itemColumnHelper.accessor((item) => item.collection.name, {
  id: 'collection',
  header: 'Collection',
});

const numberColumn = itemColumnHelper.accessor((item) => item.funko.number, {
  id: 'number',
  header: 'Number',
  cell: ({ getValue }) => <span className="tabular-nums">#{getValue()}</span>,
});

const categoryColumn = itemColumnHelper.accessor((item) => item.funko.category.name, {
  id: 'category',
  header: 'Category',
  cell: ({ row, getValue }) => (
    <Link
      viewTransition
      to={funkosInCategoryPath(row.original.funko.category.id)}
      className={cn('underline-offset-4 hover:underline', LINK_FOCUS_CLASS)}
    >
      {getValue()}
    </Link>
  ),
});

const actionsColumn = itemColumnHelper.display({
  id: 'actions',
  header: () => <span className="sr-only">Actions</span>,
  cell: ({ row }) => <ItemRowMenu item={row.original} />,
});

// The collection column only where the list spans several collections (/items).
export function buildItemTableColumns(hasCollectionColumn: boolean) {
  const leading = hasCollectionColumn ? [photoColumn, nameColumn, collectionColumn] : [photoColumn, nameColumn];

  return itemColumnHelper.columns([
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
