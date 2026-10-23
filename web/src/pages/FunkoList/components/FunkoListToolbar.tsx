import FilterChips from '@components/FilterChips';
import FilterPanel from '@components/FilterPanel';
import SearchInput from '@components/SearchInput';
import LayoutToggle from '@components/LayoutToggle';
import SortSelect from '@components/SortSelect';
import type { FunkoLayoutUtil } from '@utils/layoutUtils';
import { FunkoApiSortingFields } from '@services/funkoService/funkoService';
import { buildQuickFilters, FUNKO_SORT_OPTIONS } from '../funkoListUtils';
import { useFunkoListParams } from '../hooks/useFunkoListParams';
import FunkoFilters from './FunkoFilters';
import QuickFilters from './QuickFilters';

type Props = {
  layout: FunkoLayoutUtil;
  onLayoutChange: (layout: FunkoLayoutUtil) => void;
};

// Search, sort, filters and the layout choice; quick filters under them, then the other applied filters.
function FunkoListToolbar({ layout, onLayoutChange }: Props) {
  const { data, query, filters, chips, setQuery, setFilter, setSort, clearFilters } = useFunkoListParams();
  const sortOptions = query
    ? FUNKO_SORT_OPTIONS
    : FUNKO_SORT_OPTIONS.filter((option) => option.field !== FunkoApiSortingFields.RELEVANCE);
  const quickFilters = buildQuickFilters(data.collections);
  // A filter set by a pressed quick chip is already on screen; listing it again under "Applied" would repeat it.
  const otherChips = chips.filter(
    (chip) => !quickFilters.some(({ field, value }) => field === chip.key && filters[field] === value),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search funkos"
          placeholder="Search name, number, tag…"
          className="min-w-56 flex-1"
        />
        <SortSelect options={sortOptions} field={data.sort.field} direction={data.sort.direction} onChange={setSort} />
        <FilterPanel activeCount={chips.length} resultCount={data.funkosResponse.totalResultNumber}>
          <FunkoFilters
            categories={data.categories}
            collections={data.collections}
            tags={data.tags}
            filters={filters}
            onChange={setFilter}
          />
        </FilterPanel>
        {/* Right-aligned beside the filters; on a phone they wrap to their own row and start at the left. */}
        <div className="flex items-center gap-2 @md:ml-auto">
          <LayoutToggle value={layout} onChange={onLayoutChange} />
        </div>
      </div>
      <QuickFilters quickFilters={quickFilters} filters={filters} onChange={setFilter} />
      <FilterChips chips={otherChips} onClearAll={clearFilters} />
    </div>
  );
}

export default FunkoListToolbar;
