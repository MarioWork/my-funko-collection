import type { RouteObject } from 'react-router';
import { ADD_ROUTES_PATHS } from '../routesUtils';

const addRoute = () => import('@pages/Add/Add.route');

// The same flow as a child of a page (Home, Funkos): a dialog over it on desktop, a page on phones.
export const nestedAddRoutes: RouteObject[] = [
  { path: ADD_ROUTES_PATHS.NESTED_FORM, lazy: addRoute },
  { path: ADD_ROUTES_PATHS.NESTED_SCAN, lazy: addRoute },
];

// Both paths render the same page; /add/manual opens on the full form instead of the scanner.
export const addRoutes: RouteObject[] = [
  { path: ADD_ROUTES_PATHS.BASE, lazy: addRoute },
  { path: ADD_ROUTES_PATHS.MANUAL, lazy: addRoute },
];
