import { http, HttpResponse } from 'msw/http';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import notificationService from './notificationService';

type ReceivedRequest = { method: string; path: string; body: unknown };

const NOTIFICATION = {
  id: 7,
  kind: 'SUBMISSION_APPROVED',
  funkoId: 3,
  funkoName: 'Thanos',
  reason: null,
  isRead: true,
  createdAt: '2026-10-01T12:00:00.000Z',
};

describe('getNotifications', () => {
  it('sends the page and its size under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/notifications`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await notificationService.getNotifications({ pagination: { page: '2', size: '100' } });

    expect(Object.fromEntries(receivedQuery)).toEqual({ page: '2', size: '100' });
  });
});

describe('getUnreadCount', () => {
  it('returns the count the API answers', async () => {
    server.use(http.get(`${TEST_BASE_API_URL}/notifications/unread-count`, () => HttpResponse.json({ count: 4 })));

    const unread = await notificationService.getUnreadCount();

    expect(unread).toEqual({ count: 4 });
  });
});

describe('updateNotification', () => {
  it('patches the one notification and returns it in a success envelope', async () => {
    let received: ReceivedRequest | undefined;
    server.use(
      http.patch(`${TEST_BASE_API_URL}/notifications/:notificationId`, async ({ request }) => {
        received = { method: request.method, path: new URL(request.url).pathname, body: await request.json() };

        return HttpResponse.json(NOTIFICATION);
      }),
    );

    const result = await notificationService.updateNotification(7, { isRead: true });

    expect(received).toEqual({ method: 'PATCH', path: '/api/notifications/7', body: { isRead: true } });
    expect(result).toEqual({ success: true, data: NOTIFICATION });
  });

  it('returns a failure envelope when the notification is not found', async () => {
    server.use(
      http.patch(`${TEST_BASE_API_URL}/notifications/:notificationId`, () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'Notification 7 not found' }, { status: 404 }),
      ),
    );

    const result = await notificationService.updateNotification(7, { isRead: true });

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('markAllNotificationsRead', () => {
  it('patches every notification read', async () => {
    let received: ReceivedRequest | undefined;
    server.use(
      http.patch(`${TEST_BASE_API_URL}/notifications`, async ({ request }) => {
        received = { method: request.method, path: new URL(request.url).pathname, body: await request.json() };

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const result = await notificationService.markAllNotificationsRead();

    expect(received).toEqual({ method: 'PATCH', path: '/api/notifications', body: { isRead: true } });
    expect(result.success).toBe(true);
  });
});
