import type { ImageListEntryApiModel } from '@app-types/models';
import { SortingDirectionUtil } from '@app-types/utility';
import type { FilterOption } from '@components/SelectFilter';
import type { SortField } from '@components/SortSelect';
import { ImageApiSortingFields } from '@services/imageService/imageService';
import { ALPHABETICAL_LABELS, DATE_LABELS, SIZE_LABELS } from '@utils/sortUtils';

export const IMAGE_PAGE_SIZE = '50';
export const IMAGE_GROUP_PAGE_SIZE = '25';

// Every image as its own row, or one row per funko with its images inside.
export const IMAGE_VIEW_PARAM = 'view';
export const ImageViewUtil = {
  IMAGES: 'images',
  FUNKOS: 'funkos',
} as const;
export type ImageViewUtil = (typeof ImageViewUtil)[keyof typeof ImageViewUtil];

// Placeholder rows while the next page loads, column by column like the real ones.
export const IMAGE_SKELETON_COLUMNS = ['', 'hidden @3xl:table-cell', '', 'hidden @3xl:table-cell'];

// All three stored sizes (2000 / 1200 / 480 px) on disk: fewer means some went missing.
export const COMPLETE_VARIANT_COUNT = 3;

// Biggest files first by default: the page is mostly for finding what takes up space.
export const IMAGE_SORT_FIELDS: SortField[] = [
  {
    field: ImageApiSortingFields.SIZE,
    label: 'Size',
    defaultDirection: SortingDirectionUtil.DESC,
    directionLabels: SIZE_LABELS,
  },
  {
    field: ImageApiSortingFields.CREATION_DATE,
    label: 'Date added',
    defaultDirection: SortingDirectionUtil.DESC,
    directionLabels: DATE_LABELS,
  },
  {
    field: ImageApiSortingFields.NAME,
    label: 'Name',
    defaultDirection: SortingDirectionUtil.ASC,
    directionLabels: ALPHABETICAL_LABELS,
  },
];

export const HAS_FUNKO_OPTIONS: FilterOption[] = [
  { value: 'true', label: 'Being used' },
  { value: 'false', label: 'Not being used' },
];

const UNKNOWN = '—';

// "Eleven #421", or "No funko" for a loose file.
export function imageTitle(image: ImageListEntryApiModel): string {
  return image.funko ? `${image.funko.name} #${image.funko.number}` : 'No funko';
}

// "2000 × 2667", or a dash when it could not be read.
export function imageDimensions(image: ImageListEntryApiModel): string {
  return image.width && image.height ? `${image.width} × ${image.height}` : UNKNOWN;
}
