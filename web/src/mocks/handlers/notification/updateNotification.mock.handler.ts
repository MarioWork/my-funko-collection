import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { badRequest, notFound } from '@mocks/mockResponses';
import type { UpdateNotification } from '@services/notificationService/notificationService.type';
import { findOwnNotification, toNotificationModel } from './notificationMockUtils';

// Marks one of the signed-in user's notifications read. Another user's answers 404, like the API.
export default (baseUrl: string) => [
  http.patch(`${baseUrl}/notifications/:notificationId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as Partial<UpdateNotification>;

    if (body.isRead !== true) return badRequest('A notification can only be marked read');

    const row = findOwnNotification(String(params.notificationId));

    if (!row) return notFound('Notification', String(params.notificationId));

    row.isRead = true;

    return HttpResponse.json(toNotificationModel(row));
  }),
];
