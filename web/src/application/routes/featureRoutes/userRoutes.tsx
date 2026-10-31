import type { RouteObject } from 'react-router';
import { USER_ROUTES_PATHS } from '../routesUtils';

export const userRoutes: RouteObject[] = [
  {
    path: USER_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/UserList/UserList.route'),
    children: [
      {
        path: USER_ROUTES_PATHS.ADD,
        lazy: () => import('@pages/UserList/components/AddUserDialog/AddUserDialog.route'),
      },
    ],
  },
];
