// An admin removes a funko other users have from the catalogue (issue #13): they learn how many users have it, never
// whose collections; a reason is needed; and each user who had it is told, with the reason.
import { buildApp, type App } from '../../../app.ts';
import { resetTestDb } from '../../../testDb.ts';
import { removalRepository } from './removal.repository.ts';
import {
  createCollection,
  createFunko,
  createItem,
  createUser,
  defaultCollectionId,
  type SignedInClient,
  signIn,
} from '../../../testFixtures.ts';

const REASON = 'Two entries for the same figure';

type ErrorBody = { code: string; message: string; userCount?: number };
type NotificationBody = { kind: string; funkoId: number | null; funkoName: string; reason: string | null };

let app: App;
let admin: SignedInClient;
let luke: SignedInClient;
let han: SignedInClient;
let funkoId: number;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

// Two members, each with the funko in their own collection; the admin has none of it.
beforeEach(async () => {
  await resetTestDb();
  admin = await signIn(app);
  luke = await signIn(app, { userId: (await createUser('Luke')).id });
  han = await signIn(app, { userId: (await createUser('Han')).id });
  funkoId = (await createFunko({ name: 'Grogu' })).id;
  await createItem(await defaultCollectionId(luke.userId), funkoId);
  await createItem((await createCollection({ name: 'Secret shelf', userId: han.userId })).id, funkoId);
});

async function notificationsOf(client: SignedInClient): Promise<NotificationBody[]> {
  const response = await client.inject({ method: 'GET', url: '/notifications' });

  return response.json<{ data: NotificationBody[] }>().data;
}

type RemovalBody = { reason: string };

function forceDelete(client: SignedInClient, payload?: RemovalBody) {
  return client.inject({ method: 'DELETE', url: `/funkos/${funkoId}`, query: { force: 'true' }, payload });
}

describe('DELETE /funkos/:funkoId (in other users’ collections)', () => {
  it('returns 409 IN_COLLECTIONS with how many users have it when force is not set', async () => {
    const response = await admin.inject({ method: 'DELETE', url: `/funkos/${funkoId}` });

    expect(response.statusCode).toBe(409);
    expect(response.json<ErrorBody>()).toMatchObject({ code: 'IN_COLLECTIONS', userCount: 2 });
  });

  it('never names other users or their collections when it answers 409', async () => {
    const response = await admin.inject({ method: 'DELETE', url: `/funkos/${funkoId}` });

    const { message } = response.json<ErrorBody>();
    expect(message).not.toMatch(/Luke|Han|Secret shelf|Owned/);
  });

  it('returns 400 and keeps the funko when force=true comes without a reason', async () => {
    const response = await forceDelete(admin);

    expect(response.statusCode).toBe(400);
    expect((await admin.inject({ method: 'GET', url: `/funkos/${funkoId}` })).statusCode).toBe(200);
  });

  it('returns 400 when the reason is only spaces', async () => {
    const response = await forceDelete(admin, { reason: '   ' });

    expect(response.statusCode).toBe(400);
  });

  it('deletes it everywhere and tells each user who had it its name and the reason when force=true comes with a reason', async () => {
    const response = await forceDelete(admin, { reason: REASON });

    expect(response.statusCode).toBe(204);
    expect((await admin.inject({ method: 'GET', url: `/funkos/${funkoId}` })).statusCode).toBe(404);
    const expected = { kind: 'FUNKO_REMOVED', funkoId: null, funkoName: 'Grogu', reason: REASON };
    expect(await notificationsOf(luke)).toEqual([expect.objectContaining(expected)]);
    expect(await notificationsOf(han)).toEqual([expect.objectContaining(expected)]);
  });

  it('does not tell the admin when the admin did not have it', async () => {
    await forceDelete(admin, { reason: REASON });

    expect(await notificationsOf(admin)).toEqual([]);
  });

  it('tells the admin too when the admin had it in a collection', async () => {
    await createItem(await defaultCollectionId(admin.userId), funkoId);

    await forceDelete(admin, { reason: REASON });

    expect(await notificationsOf(admin)).toEqual([expect.objectContaining({ kind: 'FUNKO_REMOVED', reason: REASON })]);
  });
});

describe('DELETE /funkos/:funkoId (only in the signed-in user’s collections)', () => {
  it('deletes it and tells nobody when force=true comes without a reason', async () => {
    const ownFunko = await createFunko({ name: 'Mando' });
    await createItem(await defaultCollectionId(admin.userId), ownFunko.id);

    const response = await admin.inject({ method: 'DELETE', url: `/funkos/${ownFunko.id}`, query: { force: 'true' } });

    expect(response.statusCode).toBe(204);
    expect(await notificationsOf(admin)).toEqual([]);
  });

  it('returns 409 with a userCount of 1 when force is not set', async () => {
    const ownFunko = await createFunko({ name: 'Mando' });
    await createItem(await defaultCollectionId(admin.userId), ownFunko.id);

    const response = await admin.inject({ method: 'DELETE', url: `/funkos/${ownFunko.id}` });

    expect(response.json<ErrorBody>()).toMatchObject({ code: 'IN_COLLECTIONS', userCount: 1 });
  });
});

describe('GET /funkos/:funkoId (userCount)', () => {
  it('tells how many users have it when an admin asks', async () => {
    const response = await admin.inject({ method: 'GET', url: `/funkos/${funkoId}` });

    expect(response.json<{ userCount?: number }>().userCount).toBe(2);
  });

  it('leaves userCount out when a member asks', async () => {
    const response = await luke.inject({ method: 'GET', url: `/funkos/${funkoId}` });

    expect(response.json<{ userCount?: number }>()).not.toHaveProperty('userCount');
  });
});

// The service checks the reason first; the repository checks again in its transaction, for a user who added the
// funko in between.
describe('removalRepository.deleteWithItems', () => {
  it('refuses and deletes nothing when other users have it and no reason was given', async () => {
    const outcome = await removalRepository.deleteWithItems(funkoId, { userId: admin.userId, hasReason: false });

    expect(outcome).toEqual({ isRefused: true });
    expect((await admin.inject({ method: 'GET', url: `/funkos/${funkoId}` })).statusCode).toBe(200);
  });

  it('answers every user who had it when the deleter gave a reason', async () => {
    const outcome = await removalRepository.deleteWithItems(funkoId, { userId: admin.userId, hasReason: true });

    expect(outcome).toEqual({ isRefused: false, holderIds: [luke.userId, han.userId] });
  });
});
