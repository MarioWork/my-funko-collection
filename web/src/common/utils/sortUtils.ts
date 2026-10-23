import { SortingDirectionUtil } from '@app-types/utility';
import type { DirectionLabels } from '@components/SortSelect';

// The words for each kind of order, shared by every list's sort fields.
export const ALPHABETICAL_LABELS: DirectionLabels = {
  [SortingDirectionUtil.ASC]: 'A–Z',
  [SortingDirectionUtil.DESC]: 'Z–A',
};

export const NUMERIC_LABELS: DirectionLabels = {
  [SortingDirectionUtil.ASC]: 'Low to high',
  [SortingDirectionUtil.DESC]: 'High to low',
};

export const DATE_LABELS: DirectionLabels = {
  [SortingDirectionUtil.ASC]: 'Oldest first',
  [SortingDirectionUtil.DESC]: 'Newest first',
};

export const SIZE_LABELS: DirectionLabels = {
  [SortingDirectionUtil.ASC]: 'Smallest first',
  [SortingDirectionUtil.DESC]: 'Largest first',
};
