import { SortingDirectionUtil } from '@app-types/utility';
import type { SortOption } from '@components/SortSelect';
import { FunkoApiSortingFields } from '@services/funkoService/funkoService';

// Divisible by 2, 3, 4, 5 and 6, so every grid width ends on a full row.
export const FUNKO_PAGE_SIZE = '60';
export const FILTER_OPTIONS_PAGE_SIZE = '100';

export const FUNKO_VIEW_STORAGE_KEY = 'funkos.view';
export const FUNKO_DENSITY_STORAGE_KEY = 'funkos.density';

export const FunkoViewUtil = { GRID: 'grid', LIST: 'list' } as const;
export type FunkoViewUtil = (typeof FunkoViewUtil)[keyof typeof FunkoViewUtil];

export const FunkoDensityUtil = { COMFORTABLE: 'comfortable', COMPACT: 'compact' } as const;
export type FunkoDensityUtil = (typeof FunkoDensityUtil)[keyof typeof FunkoDensityUtil];

export const FUNKO_SORT_OPTIONS: SortOption[] = [
  { field: FunkoApiSortingFields.RELEVANCE, direction: SortingDirectionUtil.ASC, label: 'Best match' },
  { field: FunkoApiSortingFields.NAME, direction: SortingDirectionUtil.ASC, label: 'Name A–Z' },
  { field: FunkoApiSortingFields.NAME, direction: SortingDirectionUtil.DESC, label: 'Name Z–A' },
  { field: FunkoApiSortingFields.NUMBER, direction: SortingDirectionUtil.ASC, label: 'Number, low first' },
  { field: FunkoApiSortingFields.NUMBER, direction: SortingDirectionUtil.DESC, label: 'Number, high first' },
  { field: FunkoApiSortingFields.CREATION_DATE, direction: SortingDirectionUtil.DESC, label: 'Newest first' },
  { field: FunkoApiSortingFields.CREATION_DATE, direction: SortingDirectionUtil.ASC, label: 'Oldest first' },
  { field: FunkoApiSortingFields.CATEGORY, direction: SortingDirectionUtil.ASC, label: 'Category' },
];
