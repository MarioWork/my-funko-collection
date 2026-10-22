import type { RouteObject } from 'react-router';
import { TAG_ROUTES_PATHS } from '../routesUtils';

export const tagRoutes: RouteObject[] = [
  { path: TAG_ROUTES_PATHS.BASE, lazy: () => import('@pages/TagList/TagList.route') },
  {
    path: TAG_ROUTES_PATHS.update(),
    lazy: { action: async () => (await import('@pages/TagList/tagListActions')).tagAction },
  },
];
