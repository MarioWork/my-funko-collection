import type { CollectionApiModel } from '@app-types/models';
import { SortingDirectionUtil } from '@app-types/utility';
import type { SortOption } from '@components/SortSelect';
import { FunkoApiSearchFields, FunkoApiSortingFields } from '@services/funkoService/funkoService';
import type { FunkoFilterField } from './hooks/useFunkoListParams';

// Divisible by 2, 3, 4, 5 and 6, so every grid width ends on a full row.
export const FUNKO_PAGE_SIZE = '60';
export const FILTER_OPTIONS_PAGE_SIZE = '100';

export const FUNKO_LAYOUT_STORAGE_KEY = 'funkos.layout';

export const FUNKO_SORT_OPTIONS: SortOption[] = [
  { field: FunkoApiSortingFields.RELEVANCE, direction: SortingDirectionUtil.ASC, label: 'Best match' },
  { field: FunkoApiSortingFields.NAME, direction: SortingDirectionUtil.ASC, label: 'Name A–Z' },
  { field: FunkoApiSortingFields.NAME, direction: SortingDirectionUtil.DESC, label: 'Name Z–A' },
  { field: FunkoApiSortingFields.NUMBER, direction: SortingDirectionUtil.ASC, label: 'Number, low first' },
  { field: FunkoApiSortingFields.NUMBER, direction: SortingDirectionUtil.DESC, label: 'Number, high first' },
  { field: FunkoApiSortingFields.CREATION_DATE, direction: SortingDirectionUtil.DESC, label: 'Newest first' },
  { field: FunkoApiSortingFields.CREATION_DATE, direction: SortingDirectionUtil.ASC, label: 'Oldest first' },
  { field: FunkoApiSortingFields.CATEGORY, direction: SortingDirectionUtil.ASC, label: 'Category' },
  { field: FunkoApiSortingFields.SERIES, direction: SortingDirectionUtil.ASC, label: 'Series' },
];

// A chip under the search that sets one filter to one value.
export type QuickFilter = {
  key: string;
  label: string;
  field: FunkoFilterField;
  value: string;
};

const TRUE_VALUE = 'true';
const FALSE_VALUE = 'false';

// One chip per collection ("Owned", "Wishlist"), then chase and the funkos still missing a photo.
export function buildQuickFilters(collections: CollectionApiModel[]): QuickFilter[] {
  const collectionFilters = collections.map((collection) => ({
    key: `collection-${collection.id}`,
    label: collection.name,
    field: FunkoApiSearchFields.COLLECTION_ID,
    value: String(collection.id),
  }));

  return [
    ...collectionFilters,
    { key: 'chase', label: 'Chase', field: FunkoApiSearchFields.IS_CHASE, value: TRUE_VALUE },
    { key: 'no-photos', label: 'No images', field: FunkoApiSearchFields.HAS_IMAGES, value: FALSE_VALUE },
  ];
}
