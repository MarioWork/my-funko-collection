import type { ComponentProps, ReactNode } from 'react';
import type { CategoryApiModel, CollectionApiModel, CollectionItemApiModel, TagApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import FunkoGrid from '@components/FunkoGrid';
import ListPagination from '@components/ListPagination';
import PageHeader from '@components/PageHeader';
import type { SortOption } from '@components/SortSelect';
import { useIsRefreshing } from '@hooks/useIsRefreshing';
import { useItemActions } from '@hooks/useItemActions';
import { useItemListParams } from '@hooks/useItemListParams';
import { useLayoutPreference } from '@hooks/useLayoutPreference';
import { useIsDesktop } from '@hooks/useMediaQuery';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS } from '@utils/motionUtils';
import ItemCard from './components/ItemCard';
import ItemsEmpty from './components/ItemsEmpty';
import ItemGridCard from './components/ItemGridCard';
import ItemTable from './components/ItemTable';
import ItemsToolbar from './components/ItemsToolbar';

type Props = {
  // The page's title, back link and actions; the toolbar (search, sort, filters, layout) goes inside that tile.
  header: Omit<ComponentProps<typeof PageHeader>, 'children'>;
  itemsResponse: ResponseWithPaginationUtil<CollectionItemApiModel>;
  page: number;
  pageSize: number;
  sort: SortOption;
  categories: CategoryApiModel[];
  tags: TagApiModel[];
  collections: CollectionApiModel[];
  hasCollectionFilter: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
};

const ITEMS_LAYOUT_STORAGE_KEY = 'items.layout';

// The page header with the toolbar in it, then one tile with the items as a large or small grid (the default is the large one) or as a list (a table from `lg`,
// rows below it) and the pager. Used by a collection's page and /items.
function ItemsList({
  header,
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
  const isRefreshing = useIsRefreshing();
  const { busyItemId, move, remove } = useItemActions();
  const { layout, density, setLayout } = useLayoutPreference(ITEMS_LAYOUT_STORAGE_KEY);
  const hasItems = itemsResponse.data.length > 0;
  const isList = density === null;
  const { query, chips, setQuery, clearFilters } = useItemListParams({
    categories,
    tags,
    collections,
    hasCollectionFilter,
  });
  const isFiltered = query.length > 0 || chips.length > 0;

  const clearAll = () => {
    setQuery('');
    clearFilters();
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader {...header}>
        <ItemsToolbar
          categories={categories}
          tags={tags}
          collections={collections}
          hasCollectionFilter={hasCollectionFilter}
          resultCount={itemsResponse.totalResultNumber}
          sort={sort}
          layout={layout}
          onLayoutChange={setLayout}
        />
      </PageHeader>
      {/* Dims while new results load. */}
      <div
        aria-busy={isRefreshing}
        className={cn(
          'flex flex-col gap-4 rounded-xl border bg-card p-4',
          DIMMABLE_CLASS,
          isRefreshing && DIMMED_CLASS,
        )}
      >
        {!hasItems ? (
          <ItemsEmpty
            isFiltered={isFiltered}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyAction={emptyAction}
            onClearFilters={clearAll}
          />
        ) : null}
        {hasItems && density ? (
          <FunkoGrid label="Items" density={density}>
            {itemsResponse.data.map((item) => (
              <ItemGridCard
                key={item.id}
                item={item}
                collections={collections}
                density={density}
                isBusy={busyItemId === item.id}
                onMove={move}
                onRemove={remove}
              />
            ))}
          </FunkoGrid>
        ) : null}
        {hasItems && isList && isDesktop ? (
          <ItemTable
            items={itemsResponse.data}
            collections={collections}
            hasCollectionColumn={hasCollectionFilter}
            busyItemId={busyItemId}
            onMove={move}
            onRemove={remove}
          />
        ) : null}
        {hasItems && isList && !isDesktop ? (
          <ul className="flex flex-col gap-2">
            {itemsResponse.data.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                collections={collections}
                hasCollectionColumn={hasCollectionFilter}
                isBusy={busyItemId === item.id}
                onMove={move}
                onRemove={remove}
              />
            ))}
          </ul>
        ) : null}
        <ListPagination page={page} size={pageSize} total={itemsResponse.totalResultNumber} />
      </div>
    </div>
  );
}

export default ItemsList;
