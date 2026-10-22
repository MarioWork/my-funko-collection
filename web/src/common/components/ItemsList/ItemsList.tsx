import { PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CategoryApiModel, CollectionApiModel, CollectionItemApiModel, TagApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil, SortingDirectionUtil } from '@app-types/utility';
import EmptyState from '@components/EmptyState';
import ListPagination from '@components/ListPagination';
import { useItemActions } from '@hooks/useItemActions';
import { useIsDesktop } from '@hooks/useMediaQuery';
import ItemCard from './components/ItemCard';
import ItemTable from './components/ItemTable';
import ItemsToolbar from './components/ItemsToolbar';

type Props = {
  itemsResponse: ResponseWithPaginationUtil<CollectionItemApiModel>;
  page: number;
  pageSize: number;
  sort: { field: string; direction: SortingDirectionUtil };
  categories: CategoryApiModel[];
  tags: TagApiModel[];
  collections: CollectionApiModel[];
  hasCollectionFilter: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
};

// Toolbar, then a table from `lg` or cards below it, then the pager. Used by a collection's page and /items.
function ItemsList({
  itemsResponse,
  page,
  pageSize,
  sort,
  categories,
  tags,
  collections,
  hasCollectionFilter,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: Props) {
  const isDesktop = useIsDesktop();
  const { busyItemId, move, remove } = useItemActions();
  const hasItems = itemsResponse.data.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <ItemsToolbar
        categories={categories}
        tags={tags}
        collections={collections}
        hasCollectionFilter={hasCollectionFilter}
        resultCount={itemsResponse.totalResultNumber}
        sort={sort}
      />
      {!hasItems ? (
        <EmptyState icon={PackageOpen} title={emptyTitle} description={emptyDescription}>
          {emptyAction}
        </EmptyState>
      ) : null}
      {hasItems && isDesktop ? (
        <ItemTable
          items={itemsResponse.data}
          collections={collections}
          showCollection={hasCollectionFilter}
          busyItemId={busyItemId}
          onMove={move}
          onRemove={remove}
        />
      ) : null}
      {hasItems && !isDesktop ? (
        <ul className="flex flex-col gap-2">
          {itemsResponse.data.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              collections={collections}
              showCollection={hasCollectionFilter}
              isBusy={busyItemId === item.id}
              onMove={move}
              onRemove={remove}
            />
          ))}
        </ul>
      ) : null}
      <ListPagination page={page} size={pageSize} total={itemsResponse.totalResultNumber} />
    </div>
  );
}

export default ItemsList;
