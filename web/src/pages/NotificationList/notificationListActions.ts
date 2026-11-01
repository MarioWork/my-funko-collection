import { redirect, type ActionFunctionArgs } from 'react-router';
import type { NotificationApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import notificationService from '@services/notificationService/notificationService';
import type { UpdateNotification } from '@services/notificationService/notificationService.type';
import { parseFormData } from '@utils/formDataUtils';
import { targetOf } from './notificationListUtils';

// The only change a notification takes; nothing comes from the request but its id.
const MARK_READ_FIELDS: UpdateNotification = { isRead: true };

// `isOpening`: the user opened it (useMarkRead), so once it is marked read, go where it leads.
type MarkReadFormData = {
  isOpening?: boolean;
};

// Marks a notification read. Opening one then redirects to what it is about, worked out from the API's answer with
// the route constants (never a path from the request), so the router reloads every loader, the bell's count
// included, only after the write has landed.
export const markReadAction = async ({
  params,
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<NotificationApiModel> | Response> => {
  const { isOpening } = parseFormData<MarkReadFormData>(await request.formData());
  const result = await notificationService.updateNotification(Number(params.notificationId), MARK_READ_FIELDS);
  const target = result.data ? targetOf(result.data) : undefined;

  if (isOpening && result.success && target) return redirect(target);

  return result;
};

export const markAllReadAction = async (): Promise<JSONResponseUtil> => notificationService.updateAllNotifications();
