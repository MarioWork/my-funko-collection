import type { ActionFunctionArgs } from 'react-router';
import type { NotificationApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import notificationService from '@services/notificationService/notificationService';
import { UpdateNotificationSchema } from '@services/notificationService/notificationService.type';

// Opening a notification marks it read. Only the id comes from the request; the change is always "read".
export const markReadAction = async ({
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<NotificationApiModel>> => {
  const fields = await UpdateNotificationSchema.validate({ isRead: true });

  return notificationService.updateNotification(Number(params.notificationId), fields);
};

export const markAllReadAction = async (): Promise<JSONResponseUtil> => notificationService.markAllNotificationsRead();
