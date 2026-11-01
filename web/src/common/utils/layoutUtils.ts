import { FunkoGridDensityUtil, FunkoLayoutUtil, ImageViewUtil } from '@app-types/utility';

// The grid density each layout uses; the list has none.
export const LAYOUT_DENSITY_MAP: Record<FunkoLayoutUtil, FunkoGridDensityUtil | null> = {
  [FunkoLayoutUtil.LARGE_GRID]: FunkoGridDensityUtil.COMFORTABLE,
  [FunkoLayoutUtil.SMALL_GRID]: FunkoGridDensityUtil.COMPACT,
  [FunkoLayoutUtil.LIST]: null,
};

export const DEFAULT_FUNKO_LAYOUT = FunkoLayoutUtil.LARGE_GRID;

// A grid card's photo width per column count (FunkoGrid), for its `sizes`; the browser picks the image size from it.
export const FUNKO_CARD_SIZES = '(min-width: 1536px) 15vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw';

// --- Each list's layout preference, kept on this device; Settings → Layouts and the page share it ---------------

export const FUNKO_LAYOUT_STORAGE_KEY = 'funkos.layout';

export const COLLECTION_LAYOUT_STORAGE_KEY = 'collections.layout';

export const IMAGE_VIEW_STORAGE_KEY = 'images.view';
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
