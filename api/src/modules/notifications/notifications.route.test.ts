// Notifications inside the app (docs/GLOSSARY.md "Notification"): who is told what when a submission is sent,
// approved or rejected, and how a user reads and clears their own.
import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetTestDb } from '../../testDb.ts';
import {
  createCategory,
  createFunko,
  createUser,
  deleteUser,
  type SignedInClient,
  signIn,
} from '../../testFixtures.ts';

const REASON = 'The photo shows a different figure';
const DAY_MS = 24 * 60 * 60 * 1000;

let app: App;
let admin: SignedInClient;
let member: SignedInClient;

type NotificationBody = {
  id: number;
  kind: string;
  funkoId: number | null;
  funkoName: string;
  reason: string | null;
  isRead: boolean;
  createdAt: string;
};
type NotificationListBody = { data: NotificationBody[]; totalResultNumber: number; currentPage: number };

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  admin = await signIn(app);
  member = await signIn(app, { role: 'MEMBER' });
});

async function notificationsOf(client: SignedInClient): Promise<NotificationBody[]> {
  const response = await client.inject({ method: 'GET', url: '/notifications' });

  return response.json<NotificationListBody>().data;
}

async function unreadCountOf(client: SignedInClient): Promise<number> {
  const response = await client.inject({ method: 'GET', url: '/notifications/unread-count' });

  return response.json<{ count: number }>().count;
}

async function sendIn(client: SignedInClient, name = 'Thanos'): Promise<number> {
  const category = await createCategory();
  const response = await client.inject({
    method: 'POST',
    url: '/funkos',
    payload: { name, number: '78', categoryId: category.id },
  });

  return response.json<{ id: number }>().id;
}

async function waitingSubmissionOf(userId: number, name = 'Thanos'): Promise<number> {
  const funko = await createFunko({ name, status: 'WAITING', submittedById: userId });

  return funko.id;
}

// A notification row written straight to the database, `daysOld` days back.
async function createNotification(userId: number, daysOld = 0): Promise<number> {
  const createdAt = new Date(Date.now() - daysOld * DAY_MS);
  const row = await prisma.notification.create({
    data: { userId, kind: 'SUBMISSION_APPROVED', funkoName: 'Old one', createdAt },
    select: { id: true },
  });

  return row.id;
}

describe('POST /submissions/:funkoId/approval', () => {
  it('tells the sender their submission was approved when an admin approves it', async () => {
    const funkoId = await waitingSubmissionOf(member.userId);

    await admin.inject({ method: 'POST', url: `/submissions/${funkoId}/approval` });

    expect(await notificationsOf(member)).toMatchObject([
      { kind: 'SUBMISSION_APPROVED', funkoId, funkoName: 'Thanos', reason: null, isRead: false },
    ]);
    expect(await notificationsOf(admin)).toEqual([]);
  });

  it('tells nobody when the approved submission is an orphan submission', async () => {
    const sender = await createUser('Leaving member');
    const funkoId = await waitingSubmissionOf(sender.id);
    await deleteUser(sender.id);

    const response = await admin.inject({ method: 'POST', url: `/submissions/${funkoId}/approval` });

    expect(response.statusCode).toBe(200);
    expect(await prisma.notification.count()).toBe(0);
  });
});

describe('POST /submissions/:funkoId/rejection', () => {
  it('tells the sender their submission was rejected, with the reason, when an admin rejects it', async () => {
    const funkoId = await waitingSubmissionOf(member.userId);

    await admin.inject({ method: 'POST', url: `/submissions/${funkoId}/rejection`, payload: { reason: REASON } });

    expect(await notificationsOf(member)).toMatchObject([
      { kind: 'SUBMISSION_REJECTED', funkoId, funkoName: 'Thanos', reason: REASON, isRead: false },
    ]);
  });

  it('tells nobody when the rejected submission is an orphan submission', async () => {
    const sender = await createUser('Leaving member');
    const funkoId = await waitingSubmissionOf(sender.id);
    await deleteUser(sender.id);

    const response = await admin.inject({
      method: 'POST',
      url: `/submissions/${funkoId}/rejection`,
      payload: { reason: REASON },
    });

    expect(response.statusCode).toBe(204);
    expect(await prisma.notification.count()).toBe(0);
  });
});

describe('POST /funkos', () => {
  it('tells every admin, read-only ones included, when a member sends a new submission in', async () => {
    const otherAdmin = await signIn(app, { userId: (await createUser('Other admin', 'ADMIN')).id, isReadOnly: true });

    const funkoId = await sendIn(member);

    const expected = [{ kind: 'SUBMISSION_SENT', funkoId, funkoName: 'Thanos', reason: null, isRead: false }];
    expect(await notificationsOf(admin)).toMatchObject(expected);
    expect(await notificationsOf(otherAdmin)).toMatchObject(expected);
    expect(await notificationsOf(member)).toEqual([]);
  });

  it('tells nobody when an admin adds a funko to the catalogue', async () => {
    await sendIn(admin);

    expect(await prisma.notification.count()).toBe(0);
  });
});

describe('POST /submissions/:funkoId/resubmission', () => {
  it('tells every admin when the sender sends a rejected submission in again', async () => {
    const funko = await createFunko({ name: 'Thanos', status: 'REJECTED', submittedById: member.userId });

    const response = await member.inject({ method: 'POST', url: `/submissions/${funko.id}/resubmission` });

    expect(response.statusCode).toBe(200);
    expect(await notificationsOf(admin)).toMatchObject([
      { kind: 'SUBMISSION_RESENT', funkoId: funko.id, funkoName: 'Thanos' },
    ]);
  });
});

describe('GET /notifications', () => {
  it('lists only the signed-in user’s own notifications, newest first', async () => {
    const olderId = await createNotification(member.userId, 2);
    const newerId = await createNotification(member.userId, 1);
    await createNotification(admin.userId);

    const response = await member.inject({ method: 'GET', url: '/notifications' });

    expect(response.statusCode).toBe(200);
    expect(response.json<NotificationListBody>()).toMatchObject({
      data: [{ id: newerId }, { id: olderId }],
      totalResultNumber: 2,
      currentPage: 1,
    });
  });

  it('keeps the funko name but drops the link when the funko is deleted', async () => {
    const funkoId = await waitingSubmissionOf(member.userId);
    await admin.inject({ method: 'POST', url: `/submissions/${funkoId}/approval` });

    await prisma.funko.delete({ where: { id: funkoId } });

    expect(await notificationsOf(member)).toMatchObject([{ funkoId: null, funkoName: 'Thanos' }]);
  });

  it('leaves out notifications older than 90 days', async () => {
    await createNotification(member.userId, 91);
    const recentId = await createNotification(member.userId, 89);

    expect((await notificationsOf(member)).map(({ id }) => id)).toEqual([recentId]);
    expect(await unreadCountOf(member)).toBe(1);
  });

  it('returns 400 when the page size is over the cap', async () => {
    const response = await member.inject({ method: 'GET', url: '/notifications?size=101' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 when nobody is signed in', async () => {
    const response = await app.inject({ method: 'GET', url: '/notifications' });

    expect(response.statusCode).toBe(401);
  });
});

describe('notification clean-up', () => {
  it('deletes every user’s notifications older than 90 days when a new one is written', async () => {
    const oldId = await createNotification(admin.userId, 91);
    const recentId = await createNotification(admin.userId, 30);

    await sendIn(member);

    const remaining = await prisma.notification.findMany({ where: { userId: admin.userId }, select: { id: true } });
    expect(remaining.map(({ id }) => id)).not.toContain(oldId);
    expect(remaining.map(({ id }) => id)).toContain(recentId);
  });
});

describe('GET /notifications/unread-count', () => {
  it('counts only the signed-in user’s unread notifications', async () => {
    await createNotification(member.userId);
    const readId = await createNotification(member.userId);
    await prisma.notification.update({ where: { id: readId }, data: { readAt: new Date() } });
    await createNotification(admin.userId);

    const response = await member.inject({ method: 'GET', url: '/notifications/unread-count' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ count: 1 });
  });
});

describe('PATCH /notifications/:notificationId', () => {
  it('marks the notification read when its user opens it', async () => {
    const id = await createNotification(member.userId);

    const response = await member.inject({ method: 'PATCH', url: `/notifications/${id}`, payload: { isRead: true } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id, isRead: true });
    expect(await unreadCountOf(member)).toBe(0);
  });

  it('marks it unread again when asked', async () => {
    const id = await createNotification(member.userId);
    await member.inject({ method: 'PATCH', url: `/notifications/${id}`, payload: { isRead: true } });

    const response = await member.inject({ method: 'PATCH', url: `/notifications/${id}`, payload: { isRead: false } });

    expect(response.json()).toMatchObject({ id, isRead: false });
  });

  it('lets a read-only user mark their own notification read', async () => {
    const readOnly = await signIn(app, { userId: (await createUser('Looker')).id, isReadOnly: true });
    const id = await createNotification(readOnly.userId);

    const response = await readOnly.inject({
      method: 'PATCH',
      url: `/notifications/${id}`,
      payload: { isRead: true },
    });

    expect(response.statusCode).toBe(200);
  });

  it('returns 404 and changes nothing when the notification is another user’s', async () => {
    const id = await createNotification(admin.userId);

    const response = await member.inject({ method: 'PATCH', url: `/notifications/${id}`, payload: { isRead: true } });

    expect(response.statusCode).toBe(404);
    expect(await unreadCountOf(admin)).toBe(1);
  });

  it('returns 404 when the notification is older than 90 days', async () => {
    const id = await createNotification(member.userId, 91);

    const response = await member.inject({ method: 'PATCH', url: `/notifications/${id}`, payload: { isRead: true } });

    expect(response.statusCode).toBe(404);
  });

  it('returns 400 when the body carries an unknown field', async () => {
    const id = await createNotification(member.userId);

    const response = await member.inject({
      method: 'PATCH',
      url: `/notifications/${id}`,
      payload: { isRead: true, kind: 'SUBMISSION_SENT' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('PATCH /notifications', () => {
  it('marks every one of the user’s notifications read, and nobody else’s', async () => {
    await createNotification(member.userId);
    await createNotification(member.userId);
    await createNotification(admin.userId);

    const response = await member.inject({ method: 'PATCH', url: '/notifications', payload: { isRead: true } });

    expect(response.statusCode).toBe(204);
    expect(await unreadCountOf(member)).toBe(0);
    expect(await unreadCountOf(admin)).toBe(1);
  });

  it('lets a read-only user mark all their notifications read', async () => {
    const readOnly = await signIn(app, { userId: (await createUser('Looker')).id, isReadOnly: true });
    await createNotification(readOnly.userId);

    const response = await readOnly.inject({ method: 'PATCH', url: '/notifications', payload: { isRead: true } });

    expect(response.statusCode).toBe(204);
    expect(await unreadCountOf(readOnly)).toBe(0);
  });

  it('returns 400 when the body does not mark them read', async () => {
    const response = await member.inject({ method: 'PATCH', url: '/notifications', payload: { isRead: false } });

    expect(response.statusCode).toBe(400);
  });
});
