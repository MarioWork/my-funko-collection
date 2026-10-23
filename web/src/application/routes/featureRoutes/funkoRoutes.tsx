import type { RouteObject } from 'react-router';
import { FUNKO_ROUTES_PATHS } from '../routesUtils';
import { nestedAddRoutes } from './addRoutes';

export const funkoRoutes: RouteObject[] = [
  {
    path: FUNKO_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/FunkoList/FunkoList.route'),
    children: nestedAddRoutes,
  },
  {
    path: FUNKO_ROUTES_PATHS.detail(),
    lazy: () => import('@pages/FunkoDetail/FunkoDetail.route'),
    children: [
      {
        path: FUNKO_ROUTES_PATHS.edit(),
        lazy: () => import('@pages/FunkoDetail/components/FunkoEdit/FunkoEdit.route'),
      },
      // The collection page's item sheet, opened over this page instead of sending you to the collection.
      {
        path: FUNKO_ROUTES_PATHS.editItem(),
        lazy: () => import('@pages/CollectionDetail/components/EditItemSheet/EditItemSheet.route'),
      },
    ],
  },
  {
    path: FUNKO_ROUTES_PATHS.delete(),
    lazy: { action: async () => (await import('@pages/FunkoDetail/funkoDetailActions')).deleteFunkoAction },
  },
  {
    path: FUNKO_ROUTES_PATHS.membership(),
    lazy: { action: async () => (await import('@pages/FunkoDetail/funkoDetailActions')).membershipAction },
  },
  {
    path: FUNKO_ROUTES_PATHS.images(),
    lazy: { action: async () => (await import('@pages/FunkoDetail/funkoDetailActions')).funkoImagesAction },
  },
  {
    path: FUNKO_ROUTES_PATHS.image(),
    lazy: { action: async () => (await import('@pages/FunkoDetail/funkoDetailActions')).funkoImageAction },
  },
];
