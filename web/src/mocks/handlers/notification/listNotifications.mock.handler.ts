import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { NotificationApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { pageMockList } from '@mocks/mockListUtils';
import { ownNotifications, toNotificationModel } from './notificationMockUtils';

// The signed-in user's own notifications, newest first, like the API's GET /notifications. The seed's are recent,
// so the API's 90-day cut-off never matters here.
export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/notifications`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<NotificationApiModel>>> => {
      await delay(MOCK_DELAY);

      const notifications = ownNotifications().map(toNotificationModel);

      return HttpResponse.json(pageMockList(new URL(request.url).searchParams, notifications));
    },
  ),
];
