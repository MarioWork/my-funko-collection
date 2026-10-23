import type { RouteObject } from 'react-router';
import { IMAGE_ROUTES_PATHS } from '../routesUtils';

export const imageRoutes: RouteObject[] = [
  {
    path: IMAGE_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/ImageList/ImageList.route'),
  },
];
