import { LayoutGrid, List, Rows3, Rows4 } from 'lucide-react';
import FilterChips from '@components/FilterChips';
import FilterPanel from '@components/FilterPanel';
import SearchInput from '@components/SearchInput';
import SegmentedToggle from '@components/SegmentedToggle';
import SortSelect from '@components/SortSelect';
import { FunkoApiSortingFields } from '@services/funkoService/funkoService';
import {
  FUNKO_SORT_OPTIONS,
  type FunkoDensityUtil,
  type FunkoViewUtil,
  FunkoViewUtil as FunkoView,
} from '../funkoListUtils';
import { useFunkoListParams } from '../hooks/useFunkoListParams';
import FunkoFilters from './FunkoFilters';

type Props = {
  view: FunkoViewUtil;
  density: FunkoDensityUtil;
  onViewChange: (view: FunkoViewUtil) => void;
  onDensityChange: (density: FunkoDensityUtil) => void;
};

const VIEW_OPTIONS = [
  { value: FunkoView.GRID, label: 'Grid', icon: LayoutGrid },
  { value: FunkoView.LIST, label: 'List', icon: List },
];

const DENSITY_OPTIONS = [
  { value: 'comfortable' as const, label: 'Comfortable', icon: Rows3 },
  { value: 'compact' as const, label: 'Compact', icon: Rows4 },
];

// Search, sort, filters and the applied-filter chips; view and density toggles on the right.
function FunkoListToolbar({ view, density, onViewChange, onDensityChange }: Props) {
  const { data, query, filters, chips, setQuery, setFilter, setSort, clearFilters } = useFunkoListParams();
  const sortOptions = query
    ? FUNKO_SORT_OPTIONS
    : FUNKO_SORT_OPTIONS.filter((option) => option.field !== FunkoApiSortingFields.RELEVANCE);

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
          <SegmentedToggle label="View" options={VIEW_OPTIONS} value={view} onChange={onViewChange} isIconOnly />
          {view === FunkoView.GRID ? (
            <SegmentedToggle
              label="Density"
              options={DENSITY_OPTIONS}
              value={density}
              onChange={onDensityChange}
              isIconOnly
            />
          ) : null}
        </div>
      </div>
      <FilterChips chips={chips} onClearAll={clearFilters} />
    </div>
  );
}

export default FunkoListToolbar;
