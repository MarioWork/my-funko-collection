import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';

// The funko catalog narrowed to one category: where every category name in the app links to.
export function funkosInCategoryPath(categoryId: number): string {
  return `${FUNKO_ROUTES_PATHS.BASE}?${FunkoApiSearchFields.CATEGORY_ID}=${categoryId}`;
}

// The funko catalog narrowed to one series.
export function funkosInSeriesPath(seriesId: number): string {
  return `${FUNKO_ROUTES_PATHS.BASE}?${FunkoApiSearchFields.SERIES_ID}=${seriesId}`;
}
