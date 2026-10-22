import type { CategoryApiModel, CollectionApiModel, TagApiModel } from '@app-types/models';
import type { SortingDirectionUtil } from '@app-types/utility';
import FilterChips from '@components/FilterChips';
import FilterPanel from '@components/FilterPanel';
import SearchInput from '@components/SearchInput';
import SortSelect from '@components/SortSelect';
import { useItemListParams } from '@hooks/useItemListParams';
import { ITEM_SORT_OPTIONS } from '@utils/itemListUtils';
import ItemFilters from './ItemFilters';

type Props = {
  categories: CategoryApiModel[];
  tags: TagApiModel[];
  collections: CollectionApiModel[];
  hasCollectionFilter: boolean;
  resultCount: number;
  sort: { field: string; direction: SortingDirectionUtil };
};

function ItemsToolbar({ categories, tags, collections, hasCollectionFilter, resultCount, sort }: Props) {
  const { query, filters, chips, setQuery, setFilter, setSort, clearFilters } = useItemListParams({
    categories,
    tags,
    collections,
    hasCollectionFilter,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search items"
          placeholder="Search by name…"
          className="min-w-56 flex-1"
        />
        <SortSelect options={ITEM_SORT_OPTIONS} field={sort.field} direction={sort.direction} onChange={setSort} />
        <FilterPanel activeCount={chips.length} resultCount={resultCount}>
          <ItemFilters
            categories={categories}
            tags={tags}
            collections={collections}
            hasCollectionFilter={hasCollectionFilter}
            filters={filters}
            onChange={setFilter}
          />
        </FilterPanel>
      </div>
      <FilterChips chips={chips} onClearAll={clearFilters} />
    </div>
  );
}

export default ItemsToolbar;
