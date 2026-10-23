import type { RouteObject } from 'react-router';
import { SERIES_ROUTES_PATHS } from '../routesUtils';

export const seriesRoutes: RouteObject[] = [
  {
    path: SERIES_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/SeriesList/SeriesList.route'),
    children: [
      {
        path: SERIES_ROUTES_PATHS.ADD,
        lazy: () => import('@pages/SeriesList/components/SeriesAddPanel/SeriesAddPanel.route'),
      },
    ],
  },
  {
    path: SERIES_ROUTES_PATHS.update(),
    lazy: { action: async () => (await import('@pages/SeriesList/seriesListActions')).seriesAction },
  },
];
