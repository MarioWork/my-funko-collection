import type { CollectionApiModel } from '@app-types/models';
import { SortingDirectionUtil } from '@app-types/utility';
import type { SortField } from '@components/SortSelect';
import { FunkoApiSearchFields, FunkoApiSortingFields } from '@services/funkoService/funkoService';
import { ALPHABETICAL_LABELS, DATE_LABELS, NUMERIC_LABELS } from '@utils/sortUtils';
import type { FunkoFilterField } from './hooks/useFunkoListParams';

// Divisible by 2, 3, 4, 5 and 6, so every grid width ends on a full row.
export const FUNKO_PAGE_SIZE = '60';

export const FUNKO_SORT_FIELDS: SortField[] = [
  { field: FunkoApiSortingFields.RELEVANCE, label: 'Best match', defaultDirection: SortingDirectionUtil.ASC },
  {
    field: FunkoApiSortingFields.NAME,
    label: 'Name',
    defaultDirection: SortingDirectionUtil.ASC,
    directionLabels: ALPHABETICAL_LABELS,
  },
  {
    field: FunkoApiSortingFields.NUMBER,
    label: 'Number',
    defaultDirection: SortingDirectionUtil.ASC,
    directionLabels: NUMERIC_LABELS,
  },
  {
    field: FunkoApiSortingFields.CREATION_DATE,
    label: 'Date added',
    defaultDirection: SortingDirectionUtil.DESC,
    directionLabels: DATE_LABELS,
  },
  {
    field: FunkoApiSortingFields.CATEGORY,
    label: 'Category',
    defaultDirection: SortingDirectionUtil.ASC,
    directionLabels: ALPHABETICAL_LABELS,
  },
  {
    field: FunkoApiSortingFields.SERIES,
    label: 'Series',
    defaultDirection: SortingDirectionUtil.ASC,
    directionLabels: ALPHABETICAL_LABELS,
  },
];

// A chip under the search that sets one filter to one value.
export type QuickFilter = {
  key: string;
  label: string;
  field: FunkoFilterField;
  value: string;
};

export const TRUE_VALUE = 'true';
export const FALSE_VALUE = 'false';

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
