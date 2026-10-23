import type { RouteObject } from 'react-router';
import { CATEGORY_ROUTES_PATHS } from '../routesUtils';

export const categoryRoutes: RouteObject[] = [
  {
    path: CATEGORY_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/CategoryList/CategoryList.route'),
    children: [
      {
        path: CATEGORY_ROUTES_PATHS.ADD,
        lazy: () => import('@pages/CategoryList/components/CategoryAddPanel/CategoryAddPanel.route'),
      },
    ],
  },
  {
    path: CATEGORY_ROUTES_PATHS.update(),
    lazy: { action: async () => (await import('@pages/CategoryList/categoryListActions')).categoryAction },
  },
];
