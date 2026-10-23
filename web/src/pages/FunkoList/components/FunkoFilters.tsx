import type {
  CategoryApiModel,
  CollectionApiModel,
  NamedApiModel,
  SeriesApiModel,
  TagApiModel,
} from '@app-types/models';
import { FUNKO_TYPE_LABELS, FunkoTypeUtil } from '@app-types/utility';
import SelectFilter from '@components/SelectFilter';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import type { FunkoFilterField, FunkoFilterUpdates } from '../hooks/useFunkoListParams';
import OptionalFilter from './OptionalFilter';

type Props = {
  categories: CategoryApiModel[];
  series: SeriesApiModel[];
  collections: CollectionApiModel[];
  tags: TagApiModel[];
  filters: Record<FunkoFilterField, string | undefined>;
  onChange: (updates: FunkoFilterUpdates) => void;
};

function toFilterOptions(rows: NamedApiModel[]) {
  return rows.map((row) => ({ value: String(row.id), label: row.name }));
}

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const IMAGE_OPTIONS = [
  { value: 'true', label: 'Has images' },
  { value: 'false', label: 'No images' },
];

function FunkoFilters({ categories, series, collections, tags, filters, onChange }: Props) {
  return (
    <>
      <SelectFilter
        id="filter-category"
        label="Category"
        anyLabel="Any category"
        value={filters[FunkoApiSearchFields.CATEGORY_ID]}
        options={toFilterOptions(categories)}
        onChange={(value) => onChange({ [FunkoApiSearchFields.CATEGORY_ID]: value })}
      />
      <OptionalFilter
        id="filter-series"
        label="Series"
        anyLabel="Any series"
        noneLabel="No series"
        idField={FunkoApiSearchFields.SERIES_ID}
        hasField={FunkoApiSearchFields.HAS_SERIES}
        filters={filters}
        options={toFilterOptions(series)}
        onChange={onChange}
      />
      <SelectFilter
        id="filter-type"
        label="Type"
        anyLabel="Any type"
        value={filters[FunkoApiSearchFields.TYPE]}
        options={Object.values(FunkoTypeUtil).map((type) => ({ value: type, label: FUNKO_TYPE_LABELS[type] }))}
        onChange={(value) => onChange({ [FunkoApiSearchFields.TYPE]: value })}
      />
      <SelectFilter
        id="filter-chase"
        label="Chase"
        anyLabel="Any"
        value={filters[FunkoApiSearchFields.IS_CHASE]}
        options={YES_NO_OPTIONS}
        onChange={(value) => onChange({ [FunkoApiSearchFields.IS_CHASE]: value })}
      />
      <OptionalFilter
        id="filter-collection"
        label="Collection"
        anyLabel="Any collection"
        noneLabel="No collections"
        idField={FunkoApiSearchFields.COLLECTION_ID}
        hasField={FunkoApiSearchFields.HAS_COLLECTIONS}
        filters={filters}
        options={toFilterOptions(collections)}
        onChange={onChange}
      />
      <OptionalFilter
        id="filter-tag"
        label="Tag"
        anyLabel="Any tag"
        noneLabel="No tags"
        idField={FunkoApiSearchFields.TAG_ID}
        hasField={FunkoApiSearchFields.HAS_TAGS}
        filters={filters}
        options={toFilterOptions(tags)}
        onChange={onChange}
      />
      <SelectFilter
        id="filter-has-images"
        label="Images"
        anyLabel="Any"
        value={filters[FunkoApiSearchFields.HAS_IMAGES]}
        options={IMAGE_OPTIONS}
        onChange={(value) => onChange({ [FunkoApiSearchFields.HAS_IMAGES]: value })}
      />
    </>
  );
}

export default FunkoFilters;
