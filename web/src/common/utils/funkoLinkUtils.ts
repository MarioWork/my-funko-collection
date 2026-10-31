import type { CategoryId, SeriesId } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';

// The funko catalog narrowed to one category: where every category name in the app links to.
export function funkosInCategoryPath(categoryId: CategoryId): string {
  return `${FUNKO_ROUTES_PATHS.BASE}?${FunkoApiSearchFields.CATEGORY_ID}=${categoryId}`;
}

// The funkos in the signed-in user's own collections: what the home page counts.
export function funkosInOwnCollectionsPath(): string {
  return `${FUNKO_ROUTES_PATHS.BASE}?${FunkoApiSearchFields.HAS_COLLECTIONS}=true`;
}

// The funko catalog narrowed to one series.
export function funkosInSeriesPath(seriesId: SeriesId): string {
  return `${FUNKO_ROUTES_PATHS.BASE}?${FunkoApiSearchFields.SERIES_ID}=${seriesId}`;
}
