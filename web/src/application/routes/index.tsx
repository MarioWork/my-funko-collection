import { Navigate, type RouteObject } from 'react-router';
import AppShell from '@application/layout/AppShell';
import RouteError from '@pages/Error/RouteError';
import { addRoutes, nestedAddRoutes } from './featureRoutes/addRoutes';
import { categoryRoutes } from './featureRoutes/categoryRoutes';
import { collectionRoutes } from './featureRoutes/collectionRoutes';
import { funkoRoutes } from './featureRoutes/funkoRoutes';
import { seriesRoutes } from './featureRoutes/seriesRoutes';
import { tagRoutes } from './featureRoutes/tagRoutes';
import { BASE_ROUTES_PATHS, defaultRedirectRoute } from './routesUtils';

const routes: RouteObject[] = [
  {
    path: BASE_ROUTES_PATHS.ROOT,
    element: <AppShell />,
    errorElement: <RouteError />,
    // Shown while the first page's lazy module and loader resolve on the initial load.
    hydrateFallbackElement: (
      <p role="status" className="p-6">
        Loading…
      </p>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={defaultRedirectRoute} />,
      },
      {
        path: BASE_ROUTES_PATHS.HOME,
        lazy: () => import('@pages/Home/Home.route'),
        children: nestedAddRoutes,
      },
      {
        path: BASE_ROUTES_PATHS.SEARCH,
        lazy: () => import('@pages/Search/Search.route'),
      },
      {
        path: BASE_ROUTES_PATHS.SETTINGS,
        lazy: () => import('@pages/Settings/Settings.route'),
      },
      ...funkoRoutes,
      ...addRoutes,
      ...collectionRoutes,
      ...categoryRoutes,
      ...seriesRoutes,
      ...tagRoutes,
    ],
  },
];

export default routes;
