import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { UnreadCountApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { ownNotifications } from './notificationMockUtils';

// The bell's number: how many of the signed-in user's notifications are unread.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/notifications/unread-count`, async (): Promise<HttpResponse<UnreadCountApiModel>> => {
    await delay(MOCK_DELAY);

    const count = ownNotifications().filter((row) => !row.isRead).length;

    return HttpResponse.json({ count });
  }),
];
