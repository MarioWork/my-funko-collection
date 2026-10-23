// How a list of funkos is shown: a large grid, a small grid, or a list (a table on desktop, rows on phones).
export const FunkoLayoutUtil = { LARGE_GRID: 'large-grid', SMALL_GRID: 'small-grid', LIST: 'list' } as const;
export type FunkoLayoutUtil = (typeof FunkoLayoutUtil)[keyof typeof FunkoLayoutUtil];

export type FunkoGridDensity = 'comfortable' | 'compact';

// The grid density each layout uses; the list has none.
export const LAYOUT_DENSITY_MAP: Record<FunkoLayoutUtil, FunkoGridDensity | null> = {
  [FunkoLayoutUtil.LARGE_GRID]: 'comfortable',
  [FunkoLayoutUtil.SMALL_GRID]: 'compact',
  [FunkoLayoutUtil.LIST]: null,
};

export const DEFAULT_FUNKO_LAYOUT = FunkoLayoutUtil.LARGE_GRID;

// --- Each list's layout preference, kept on this device; Settings → Layouts and the page share it ---------------

export const FUNKO_LAYOUT_STORAGE_KEY = 'funkos.layout';

// The Collections page as a grid of cards (the default) or as a table, like the funkos page's list.
export const COLLECTION_LAYOUT_STORAGE_KEY = 'collections.layout';
export const CollectionLayoutUtil = { GRID: 'grid', LIST: 'list' } as const;
export type CollectionLayoutUtil = (typeof CollectionLayoutUtil)[keyof typeof CollectionLayoutUtil];

// The Images page: one row per funko with its images inside (the default), or every image as its own row.
export const IMAGE_VIEW_STORAGE_KEY = 'images.view';
export const ImageViewUtil = {
  IMAGES: 'images',
  FUNKOS: 'funkos',
} as const;
export type ImageViewUtil = (typeof ImageViewUtil)[keyof typeof ImageViewUtil];
export const DEFAULT_IMAGE_VIEW = ImageViewUtil.FUNKOS;

function isImageView(value: string | null): value is ImageViewUtil {
  return value === ImageViewUtil.IMAGES || value === ImageViewUtil.FUNKOS;
}

// The Images view saved on this device, for the loader (which runs outside React). Storage may be blocked.
export function readStoredImageView(): ImageViewUtil {
  try {
    const stored = window.localStorage.getItem(IMAGE_VIEW_STORAGE_KEY);

    return isImageView(stored) ? stored : DEFAULT_IMAGE_VIEW;
  } catch {
    return DEFAULT_IMAGE_VIEW;
  }
}
