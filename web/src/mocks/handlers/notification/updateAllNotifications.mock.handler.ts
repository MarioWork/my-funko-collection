import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { badRequest, noContent } from '@mocks/mockResponses';
import { ownNotifications } from './notificationMockUtils';

type MarkAllBody = { isRead?: unknown };

// "Mark all read": every one of the signed-in user's notifications, like the API's PATCH /notifications.
export default (baseUrl: string) => [
  http.patch(`${baseUrl}/notifications`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as MarkAllBody;

    if (body.isRead !== true) return badRequest('Only marking every notification read is allowed');

    for (const row of ownNotifications()) row.isRead = true;

    return noContent();
  }),
];
