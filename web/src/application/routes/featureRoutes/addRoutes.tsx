import type { RouteObject } from 'react-router';
import { ADD_ROUTES_PATHS } from '../routesUtils';

// Both paths render the same page; /add/manual opens on the full form instead of the scanner.
export const addRoutes: RouteObject[] = [
  { path: ADD_ROUTES_PATHS.BASE, lazy: () => import('@pages/Add/Add.route') },
  { path: ADD_ROUTES_PATHS.MANUAL, lazy: () => import('@pages/Add/Add.route') },
];
