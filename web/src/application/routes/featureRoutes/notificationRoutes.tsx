import type { RouteObject } from 'react-router';
import { NOTIFICATION_ROUTES_PATHS } from '../routesUtils';

export const notificationRoutes: RouteObject[] = [
  {
    path: NOTIFICATION_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/NotificationList/NotificationList.route'),
  },
  {
    path: NOTIFICATION_ROUTES_PATHS.MARK_ALL_READ,
    lazy: {
      action: async () => (await import('@pages/NotificationList/notificationListActions')).markAllReadAction,
    },
  },
  {
    path: NOTIFICATION_ROUTES_PATHS.markRead(),
    lazy: {
      action: async () => (await import('@pages/NotificationList/notificationListActions')).markReadAction,
    },
  },
];
