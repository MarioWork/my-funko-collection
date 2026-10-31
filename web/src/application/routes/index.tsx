import { Navigate, type RouteObject } from 'react-router';
import AppLoading from '@application/layout/AppLoading';
import RouteError from '@pages/Error/RouteError';
import { authMiddleware } from './authMiddleware';
import { signedInUserMiddleware } from './signedInUserMiddleware';
import { addRoutes } from './featureRoutes/addRoutes';
import { authRoutes, securityRoutes } from './featureRoutes/authRoutes';
import { categoryRoutes } from './featureRoutes/categoryRoutes';
import { collectionRoutes } from './featureRoutes/collectionRoutes';
import { funkoRoutes } from './featureRoutes/funkoRoutes';
import { imageRoutes } from './featureRoutes/imageRoutes';
import { itemRoutes } from './featureRoutes/itemRoutes';
import { seriesRoutes } from './featureRoutes/seriesRoutes';
import { tagRoutes } from './featureRoutes/tagRoutes';
import { userRoutes } from './featureRoutes/userRoutes';
import { APP_SHELL_ROUTE_ID, BASE_ROUTES_PATHS, defaultRedirectRoute } from './routesUtils';

const routes: RouteObject[] = [
  {
    path: BASE_ROUTES_PATHS.ROOT,
    errorElement: <RouteError />,
    // Shown while the first page's lazy module and loader resolve on the initial load.
    hydrateFallbackElement: <AppLoading />,
    // Any 401 from a loader or an action, anywhere below, becomes a trip to the login page.
    middleware: [authMiddleware],
    children: [
      ...authRoutes,
      {
        // Every app page needs a signed-in user: the middleware checks once, sends anyone else to the first run or
        // the login page, and puts the user in the router context for every loader and action below.
        id: APP_SHELL_ROUTE_ID,
        middleware: [signedInUserMiddleware],
        lazy: () => import('@application/layout/AppShell/AppShell.route'),
        children: [
          {
            index: true,
            element: <Navigate to={defaultRedirectRoute} />,
          },
          {
            path: BASE_ROUTES_PATHS.HOME,
            lazy: () => import('@pages/Home/Home.route'),
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
          ...itemRoutes,
          ...categoryRoutes,
          ...seriesRoutes,
          ...tagRoutes,
          ...imageRoutes,
          ...userRoutes,
          ...securityRoutes,
        ],
      },
    ],
  },
];

export default routes;
