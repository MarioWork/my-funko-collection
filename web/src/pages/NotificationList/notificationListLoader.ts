import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import notificationService from '@services/notificationService/notificationService';
import { NOTIFICATION_PAGE_SIZE } from './notificationListUtils';

// The signed-in user's notifications from the last 90 days, newest first, in one page.
export async function loader() {
  const fields = { pagination: { page: DEFAULT_FIRST_PAGE, size: NOTIFICATION_PAGE_SIZE } };

  const notificationsResponse = await notificationService.getNotifications(fields);

  return { notificationsResponse };
}
