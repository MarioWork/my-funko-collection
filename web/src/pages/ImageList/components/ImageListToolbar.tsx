import { List, ListTree } from 'lucide-react';
import FilterChips from '@components/FilterChips';
import FilterPanel from '@components/FilterPanel';
import SearchInput from '@components/SearchInput';
import ViewMenu, { type ViewOption } from '@components/ViewMenu';
import SelectFilter from '@components/SelectFilter';
import SortSelect from '@components/SortSelect';
import { useImageListParams } from '../hooks/useImageListParams';
import { ImageViewUtil } from '@utils/layoutUtils';
import { HAS_FUNKO_OPTIONS, IMAGE_SORT_FIELDS } from '../imageListUtils';

const VIEW_OPTIONS: ViewOption<ImageViewUtil>[] = [
  {
    value: ImageViewUtil.FUNKOS,
    label: 'Group by funko',
    description: 'A row per funko, with its totals',
    icon: ListTree,
  },
  { value: ImageViewUtil.IMAGES, label: 'All images', description: 'Every image as its own row', icon: List },
];

// Search, sort, the one filter (being used or not) and the view (every image, or grouped by funko); then the
// applied filter as a chip.
function ImageListToolbar() {
  const { data, query, hasFunko, chips, setQuery, setHasFunko, setView, setSort, clearFilters } = useImageListParams();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search images"
          placeholder="Search funko or file name…"
          className="min-w-56 flex-1"
        />
        <SortSelect
          fields={IMAGE_SORT_FIELDS}
          field={data.sort.field}
          direction={data.sort.direction}
          onChange={setSort}
        />
        <FilterPanel activeCount={chips.length} resultCount={data.total}>
          <SelectFilter
            id="filter-has-funko"
            label="Funko"
            anyLabel="Any"
            value={hasFunko}
            options={HAS_FUNKO_OPTIONS}
            onChange={setHasFunko}
          />
        </FilterPanel>
        <div className="flex items-center gap-2 @md:ml-auto">
          <ViewMenu label="View" options={VIEW_OPTIONS} value={data.view} onChange={setView} />
        </div>
      </div>
      <FilterChips chips={chips} onClearAll={clearFilters} />
    </div>
  );
}

export default ImageListToolbar;
