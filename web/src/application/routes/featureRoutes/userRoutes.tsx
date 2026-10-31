import type { RouteObject } from 'react-router';
import { USER_LIST_ROUTE_ID, USER_ROUTES_PATHS } from '../routesUtils';

export const userRoutes: RouteObject[] = [
  {
    id: USER_LIST_ROUTE_ID,
    path: USER_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/UserList/UserList.route'),
    children: [
      {
        path: USER_ROUTES_PATHS.ADD,
        lazy: () => import('@pages/UserList/components/AddUserDialog/AddUserDialog.route'),
      },
      {
        path: USER_ROUTES_PATHS.manage(),
        lazy: () => import('@pages/UserList/components/ManageUserDialog/ManageUserDialog.route'),
      },
    ],
  },
];
