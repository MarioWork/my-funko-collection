import getUnreadCountHandler from './getUnreadCount.mock.handler';
import listNotificationsHandler from './listNotifications.mock.handler';
import markAllNotificationsReadHandler from './markAllNotificationsRead.mock.handler';
import updateNotificationHandler from './updateNotification.mock.handler';

// The unread count first: /notifications/unread-count must not be taken for a notification id.
export const notificationMockHandlers = (baseUrl: string) => [
  ...getUnreadCountHandler(baseUrl),
  ...listNotificationsHandler(baseUrl),
  ...markAllNotificationsReadHandler(baseUrl),
  ...updateNotificationHandler(baseUrl),
];
