import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { NotificationApiModel, NotificationId, UnreadCountApiModel } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { UpdateNotification } from './notificationService.type';

const BASE_NOTIFICATIONS_URL = '/notifications';
const UNREAD_COUNT_URL = `${BASE_NOTIFICATIONS_URL}/unread-count`;
// "Mark all read": the only change the API takes for every notification at once.
const MARK_ALL_READ_BODY = { isRead: true };

// The signed-in user's own notifications (the last 90 days, newest first), the bell's unread count, and marking them
// read. A read-only user may mark them read too.
export default {
  getNotifications: async ({
    pagination,
  }: GetNotificationsFields): Promise<ResponseWithPaginationUtil<NotificationApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<NotificationApiModel>>(BASE_NOTIFICATIONS_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
      },
    });

    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountApiModel> => {
    const response = await axios.get<UnreadCountApiModel>(UNREAD_COUNT_URL);

    return response.data;
  },

  updateNotification: async (
    id: NotificationId,
    fields: UpdateNotification,
  ): Promise<JSONResponseUtil<NotificationApiModel>> =>
    axiosActions<NotificationApiModel>({
      url: `${BASE_NOTIFICATIONS_URL}/${id}`,
      method: HttpVerbsUtil.PATCH,
      data: fields,
    }),

  markAllNotificationsRead: async (): Promise<JSONResponseUtil> =>
    axiosActions({ url: BASE_NOTIFICATIONS_URL, method: HttpVerbsUtil.PATCH, data: MARK_ALL_READ_BODY }),
};

type GetNotificationsFields = {
  pagination: PaginationUtil;
};
