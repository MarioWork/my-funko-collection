import FilterChips from '@components/FilterChips';
import FilterPanel from '@components/FilterPanel';
import SearchInput from '@components/SearchInput';
import LayoutMenu from '@components/LayoutMenu';
import SortSelect, { type SortOption } from '@components/SortSelect';
import { useItemListParams } from '@hooks/useItemListParams';
import { ITEM_SORT_FIELDS } from '@utils/itemListUtils';
import type { FunkoLayoutUtil } from '@app-types/utility';
import { useItemsListContext } from '../hooks/useItemsListContext';
import ItemFilters from './ItemFilters';

type Props = {
  resultCount: number;
  sort: SortOption;
  layout: FunkoLayoutUtil;
  onLayoutChange: (layout: FunkoLayoutUtil) => void;
};

function ItemsToolbar({ resultCount, sort, layout, onLayoutChange }: Props) {
  const { categories, tags, collections, hasCollectionFilter } = useItemsListContext();
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
        <SortSelect fields={ITEM_SORT_FIELDS} field={sort.field} direction={sort.direction} onChange={setSort} />
        <FilterPanel activeCount={chips.length} resultCount={resultCount}>
          <ItemFilters filters={filters} onChange={setFilter} />
        </FilterPanel>
        <div className="@md:ml-auto">
          <LayoutMenu value={layout} onChange={onLayoutChange} />
        </div>
      </div>
      <FilterChips chips={chips} onClearAll={clearFilters} />
    </div>
  );
}

export default ItemsToolbar;
