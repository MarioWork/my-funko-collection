import type { RouteObject } from 'react-router';
import { ITEM_ROUTES_PATHS } from '../routesUtils';

export const itemRoutes: RouteObject[] = [
  // Editing from /items opens the collection's own sheet; closing it goes back here.
  { path: ITEM_ROUTES_PATHS.BASE, lazy: () => import('@pages/AllItems/AllItems.route') },
];
