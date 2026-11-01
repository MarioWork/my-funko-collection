// An admin manages existing users: their role, read-only or not, a new temporary password, or deleting them
// (issues #7 and #8, ADR 0002).
import { buildApp, type App } from '../../../app.ts';
import { prisma } from '../../../lib/prisma.ts';
import { resetTestDb } from '../../../testDb.ts';
import {
  createCollection,
  createFunko,
  createItem,
  createTag,
  createUser,
  signIn,
  type SignedInClient,
} from '../../../testFixtures.ts';
import { isCommonPassword } from '../../auth/password/password.commonPasswords.ts';

type ManagedUser = {
  id: number;
  username: string | null;
  role: string;
  isReadOnly: boolean;
  state: string;
  isLastAdmin: boolean;
};
type NewTemporaryPassword = { user: ManagedUser; temporaryPassword: string };
type Page<Row> = { data: Row[] };

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const STALE_SIGN_IN = { signedInAt: new Date(Date.now() - 11 * MINUTE_MS) };
let addressCounter = 0;

let app: App;

// Password sign-in is rate limited per address: each sign-in here speaks from its own.
function nextAddress(): string {
  addressCounter += 1;

  return `10.3.${Math.floor(addressCounter / 250)}.${addressCounter % 250}`;
}

function userUrl(userId: number): string {
  return `/users/${userId}`;
}

function temporaryPasswordUrl(userId: number): string {
  return `/users/${userId}/temporary-password`;
}

async function changeRole(admin: SignedInClient, userId: number, role: string) {
  return admin.inject({ method: 'PATCH', url: userUrl(userId), payload: { role } });
}

async function setReadOnly(admin: SignedInClient, userId: number, isReadOnly: boolean) {
  return admin.inject({ method: 'PATCH', url: userUrl(userId), payload: { isReadOnly } });
}

async function newTemporaryPassword(admin: SignedInClient, userId: number, payload: object = {}) {
  return admin.inject({ method: 'POST', url: temporaryPasswordUrl(userId), payload });
}

async function removeUser(admin: SignedInClient, userId: number) {
  return admin.inject({ method: 'DELETE', url: userUrl(userId) });
}

async function sessionCount(userId: number): Promise<number> {
  return prisma.session.count({ where: { userId } });
}

async function signInWithPassword(username: string, password: string) {
  return app.inject({
    method: 'POST',
    url: '/auth/login/password',
    remoteAddress: nextAddress(),
    payload: { username, password },
  });
}

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
});

describe('GET /users', () => {
  it('marks only the one admin as the last admin when there is a single admin', async () => {
    const admin = await signIn(app);
    await createUser('Luke');

    const response = await admin.inject({ method: 'GET', url: '/users' });

    const rows = response.json<Page<ManagedUser>>().data;
    expect(rows.map(({ id, isLastAdmin }) => ({ id, isLastAdmin }))).toEqual(
      expect.arrayContaining([{ id: admin.userId, isLastAdmin: true }]),
    );
    expect(rows.filter(({ isLastAdmin }) => isLastAdmin)).toHaveLength(1);
  });

  it('marks nobody as the last admin when there are two admins', async () => {
    const admin = await signIn(app);
    await createUser('Leia', 'ADMIN');

    const response = await admin.inject({ method: 'GET', url: '/users' });

    expect(response.json<Page<ManagedUser>>().data.some(({ isLastAdmin }) => isLastAdmin)).toBe(false);
  });
});

describe('PATCH /users/:userId', () => {
  it('makes a member an admin and ends all of their sessions when an admin asks', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await signIn(app, { userId: luke.id });
    await signIn(app, { userId: luke.id, signInMethod: 'PASSWORD' });

    const response = await changeRole(admin, luke.id, 'ADMIN');

    expect(response.statusCode).toBe(200);
    expect(response.json<ManagedUser>()).toMatchObject({ id: luke.id, role: 'ADMIN', isLastAdmin: false });
    expect(await sessionCount(luke.id)).toBe(0);
  });

  it('makes an admin a member when another admin is left', async () => {
    const admin = await signIn(app);
    const leia = await createUser('Leia', 'ADMIN');

    const response = await changeRole(admin, leia.id, 'MEMBER');

    expect(response.statusCode).toBe(200);
    expect(response.json<ManagedUser>().role).toBe('MEMBER');
  });

  it('signs the admin out when they make themselves a member', async () => {
    const admin = await signIn(app);
    await createUser('Leia', 'ADMIN');

    await changeRole(admin, admin.userId, 'MEMBER');
    const next = await admin.inject({ method: 'GET', url: '/users' });

    expect(next.statusCode).toBe(401);
  });

  it('keeps the sessions when the role does not change', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await signIn(app, { userId: luke.id });

    const response = await changeRole(admin, luke.id, 'MEMBER');

    expect(response.statusCode).toBe(200);
    expect(await sessionCount(luke.id)).toBe(1);
  });

  it('returns 409 LAST_ADMIN and keeps the role when the last admin would become a member', async () => {
    const admin = await signIn(app);

    const response = await changeRole(admin, admin.userId, 'MEMBER');

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'LAST_ADMIN' });
    const row = await prisma.user.findUniqueOrThrow({ where: { id: admin.userId }, select: { role: true } });
    expect(row.role).toBe('ADMIN');
    expect(await sessionCount(admin.userId)).toBe(1);
  });

  it('returns 403 REAUTH_REQUIRED when the admin signed in more than 10 minutes ago', async () => {
    const admin = await signIn(app, STALE_SIGN_IN);
    const luke = await createUser('Luke');

    const response = await changeRole(admin, luke.id, 'ADMIN');

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'REAUTH_REQUIRED' });
  });

  it('returns 403 ADMIN_ONLY when a member asks', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await changeRole(member, member.userId, 'ADMIN');

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('returns 404 when the user does not exist', async () => {
    const admin = await signIn(app);

    const response = await changeRole(admin, 999_999, 'ADMIN');

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns 400 when the role or a key is not allowed', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');

    const answers = [
      await changeRole(admin, luke.id, 'OWNER'),
      await admin.inject({ method: 'PATCH', url: userUrl(luke.id), payload: { role: 'ADMIN', name: 'Luke S' } }),
    ];

    expect(answers.map((answer) => answer.statusCode)).toEqual([400, 400]);
    expect(answers.map((answer) => answer.json<{ code: string }>().code)).toEqual([
      'VALIDATION_ERROR',
      'VALIDATION_ERROR',
    ]);
  });
});

describe('PATCH /users/:userId with isReadOnly', () => {
  it('makes a member read-only and ends all of their sessions when an admin asks', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await signIn(app, { userId: luke.id });

    const response = await setReadOnly(admin, luke.id, true);

    expect(response.statusCode).toBe(200);
    expect(response.json<ManagedUser>()).toMatchObject({ id: luke.id, role: 'MEMBER', isReadOnly: true });
    expect(await sessionCount(luke.id)).toBe(0);
  });

  it('lets the user write again and ends their sessions when an admin undoes it', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await signIn(app, { userId: luke.id, isReadOnly: true });

    const response = await setReadOnly(admin, luke.id, false);
    const lukeAgain = await signIn(app, { userId: luke.id });
    const created = await lukeAgain.inject({ method: 'POST', url: '/collections', payload: { name: 'For sale' } });

    expect(response.statusCode).toBe(200);
    expect(response.json<ManagedUser>().isReadOnly).toBe(false);
    expect(await sessionCount(luke.id)).toBe(1);
    expect(created.statusCode).toBe(201);
  });

  it('keeps the role when only isReadOnly is sent, and keeps isReadOnly when only the role is sent', async () => {
    const admin = await signIn(app);
    const leia = await createUser('Leia', 'ADMIN');

    await setReadOnly(admin, leia.id, true);
    const response = await changeRole(admin, leia.id, 'MEMBER');

    expect(response.json<ManagedUser>()).toMatchObject({ role: 'MEMBER', isReadOnly: true });
  });

  it('keeps the sessions when isReadOnly does not change', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await signIn(app, { userId: luke.id });

    const response = await setReadOnly(admin, luke.id, false);

    expect(response.statusCode).toBe(200);
    expect(await sessionCount(luke.id)).toBe(1);
  });

  it('makes an admin read-only when another admin who can make changes is left', async () => {
    const admin = await signIn(app);
    const leia = await createUser('Leia', 'ADMIN');

    const response = await setReadOnly(admin, leia.id, true);

    expect(response.statusCode).toBe(200);
    expect(response.json<ManagedUser>()).toMatchObject({ role: 'ADMIN', isReadOnly: true, isLastAdmin: false });
  });

  it('returns 409 LAST_ADMIN and changes nothing when the last admin would be made read-only', async () => {
    const admin = await signIn(app);

    const response = await setReadOnly(admin, admin.userId, true);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'LAST_ADMIN' });
    const row = await prisma.user.findUniqueOrThrow({ where: { id: admin.userId }, select: { isReadOnly: true } });
    expect(row.isReadOnly).toBe(false);
    expect(await sessionCount(admin.userId)).toBe(1);
  });

  it('returns 409 LAST_ADMIN when the only other admin is read-only', async () => {
    const admin = await signIn(app);
    await signIn(app, { userId: (await createUser('Leia', 'ADMIN')).id, isReadOnly: true });

    const answers = [
      await setReadOnly(admin, admin.userId, true),
      await changeRole(admin, admin.userId, 'MEMBER'),
      await removeUser(admin, admin.userId),
    ];

    expect(answers.map((answer) => answer.json<{ code: string }>().code)).toEqual([
      'LAST_ADMIN',
      'LAST_ADMIN',
      'LAST_ADMIN',
    ]);
  });

  it('marks the one admin who can make changes as the last admin when the other admin is read-only', async () => {
    const admin = await signIn(app);
    const leia = await createUser('Leia', 'ADMIN');
    await setReadOnly(admin, leia.id, true);

    const response = await admin.inject({ method: 'GET', url: '/users' });

    const lastAdmins = response
      .json<Page<ManagedUser>>()
      .data.filter(({ isLastAdmin }) => isLastAdmin)
      .map(({ id }) => id);
    expect(lastAdmins).toEqual([admin.userId]);
  });

  it('returns 403 REAUTH_REQUIRED when the admin signed in more than 10 minutes ago', async () => {
    const admin = await signIn(app, STALE_SIGN_IN);
    const luke = await createUser('Luke');

    const answers = [await setReadOnly(admin, luke.id, true), await setReadOnly(admin, luke.id, false)];

    expect(answers.map((answer) => answer.json<{ code: string }>().code)).toEqual([
      'REAUTH_REQUIRED',
      'REAUTH_REQUIRED',
    ]);
  });

  it('returns 400 VALIDATION_ERROR when the body is empty or isReadOnly is not a boolean', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');

    const answers = [
      await admin.inject({ method: 'PATCH', url: userUrl(luke.id), payload: {} }),
      await admin.inject({ method: 'PATCH', url: userUrl(luke.id), payload: { isReadOnly: 'yes' } }),
    ];

    expect(answers.map((answer) => answer.json<{ code: string }>().code)).toEqual([
      'VALIDATION_ERROR',
      'VALIDATION_ERROR',
    ]);
  });
});

describe('POST /users/:userId/temporary-password', () => {
  it('gives the user a new temporary password, shown once, that must be replaced, and ends their sessions', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await prisma.user.update({ where: { id: luke.id }, data: { username: 'luke' } });
    await signIn(app, { userId: luke.id });

    const response = await newTemporaryPassword(admin, luke.id);

    expect(response.statusCode).toBe(200);
    const { user, temporaryPassword } = response.json<NewTemporaryPassword>();
    expect(user).toMatchObject({ id: luke.id, username: 'luke', state: 'TEMPORARY_PASSWORD' });
    expect(temporaryPassword.length).toBeGreaterThanOrEqual(15);
    expect(isCommonPassword(temporaryPassword)).toBe(false);
    expect(await sessionCount(luke.id)).toBe(0);
    const signedIn = await signInWithPassword('luke', temporaryPassword);
    expect(signedIn.statusCode).toBe(200);
    expect(signedIn.json()).toMatchObject({ user: { mustChangePassword: true } });
  });

  it('dates the new temporary password to stop working 7 days after it was made', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await prisma.user.update({ where: { id: luke.id }, data: { username: 'luke' } });
    const before = Date.now();

    await newTemporaryPassword(admin, luke.id);

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: luke.id },
      select: { temporaryPasswordExpiresAt: true },
    });
    const expiresInMs = (row.temporaryPasswordExpiresAt?.getTime() ?? 0) - before;
    expect(expiresInMs).toBeGreaterThanOrEqual(7 * DAY_MS);
    expect(expiresInMs).toBeLessThan(7 * DAY_MS + MINUTE_MS);
  });

  it('stops the old password working when a new temporary password is made', async () => {
    const admin = await signIn(app);
    const created = await admin.inject({
      method: 'POST',
      url: '/users',
      payload: { username: 'luke', role: 'MEMBER' },
    });
    const { user, temporaryPassword: first } = created.json<NewTemporaryPassword>();

    const response = await newTemporaryPassword(admin, user.id);

    expect(response.json<NewTemporaryPassword>().temporaryPassword).not.toBe(first);
    expect((await signInWithPassword('luke', first)).statusCode).toBe(401);
  });

  it('sets the username too when the user has none yet', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');

    const response = await newTemporaryPassword(admin, luke.id, { username: ' Luke ' });

    expect(response.statusCode).toBe(200);
    expect(response.json<NewTemporaryPassword>().user.username).toBe('luke');
  });

  it('returns 400 and keeps the username when the user already has one and another is given', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await prisma.user.update({ where: { id: luke.id }, data: { username: 'luke' } });

    const response = await newTemporaryPassword(admin, luke.id, { username: 'skywalker' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    const row = await prisma.user.findUniqueOrThrow({ where: { id: luke.id }, select: { username: true } });
    expect(row.username).toBe('luke');
  });

  it('returns 400 USERNAME_REQUIRED when the user has no username and none is given', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');

    const response = await newTemporaryPassword(admin, luke.id);

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'USERNAME_REQUIRED' });
  });

  it('returns 409 when the username given is taken by another user', async () => {
    const admin = await signIn(app);
    await admin.inject({ method: 'POST', url: '/users', payload: { username: 'leia', role: 'MEMBER' } });
    const luke = await createUser('Luke');

    const response = await newTemporaryPassword(admin, luke.id, { username: 'LEIA' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT' });
  });

  it('returns 400 VALIDATION_ERROR when the username or a key is not allowed', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');

    const answers = [
      await newTemporaryPassword(admin, luke.id, { username: 'luke skywalker' }),
      await newTemporaryPassword(admin, luke.id, { username: 'luke', password: 'my own choice of password' }),
    ];

    expect(answers.map((answer) => answer.json<{ code: string }>().code)).toEqual([
      'VALIDATION_ERROR',
      'VALIDATION_ERROR',
    ]);
  });

  it('returns 403 REAUTH_REQUIRED when the admin signed in more than 10 minutes ago', async () => {
    const admin = await signIn(app, STALE_SIGN_IN);
    const luke = await createUser('Luke');

    const response = await newTemporaryPassword(admin, luke.id, { username: 'luke' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'REAUTH_REQUIRED' });
  });

  it('returns 403 ADMIN_ONLY when a member asks', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await newTemporaryPassword(member, member.userId, { username: 'member' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('returns 404 when the user does not exist', async () => {
    const admin = await signIn(app);

    const response = await newTemporaryPassword(admin, 999_999, { username: 'nobody' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('DELETE /users/:userId', () => {
  it('returns 400 VALIDATION_ERROR when the user id is not a number', async () => {
    const admin = await signIn(app);

    const response = await admin.inject({ method: 'DELETE', url: '/users/abc' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('deletes the user with their collections, items, tags and sessions, and keeps the catalogue funko', async () => {
    const admin = await signIn(app);
    const luke = await createUser('Luke');
    await signIn(app, { userId: luke.id });
    const funko = await createFunko({ name: 'Grogu' });
    const collection = await createCollection({ name: 'Shelf', userId: luke.id });
    const tag = await createTag('Box 1', luke.id);
    await createItem(collection.id, funko.id, { tagIds: [tag.id] });

    const response = await removeUser(admin, luke.id);

    expect(response.statusCode).toBe(204);
    expect(await prisma.user.count({ where: { id: luke.id } })).toBe(0);
    expect(await prisma.collection.count({ where: { userId: luke.id } })).toBe(0);
    expect(await prisma.collectionItem.count({ where: { collectionId: collection.id } })).toBe(0);
    expect(await prisma.tag.count({ where: { userId: luke.id } })).toBe(0);
    expect(await sessionCount(luke.id)).toBe(0);
    expect(await prisma.funko.count({ where: { id: funko.id } })).toBe(1);
  });

  it('deletes another admin when one admin is left', async () => {
    const admin = await signIn(app);
    const leia = await createUser('Leia', 'ADMIN');

    const response = await removeUser(admin, leia.id);

    expect(response.statusCode).toBe(204);
  });

  it('returns 409 LAST_ADMIN and keeps the user when the last admin would be deleted', async () => {
    const admin = await signIn(app);

    const response = await removeUser(admin, admin.userId);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'LAST_ADMIN' });
    expect(await prisma.user.count({ where: { id: admin.userId } })).toBe(1);
  });

  it('returns 403 REAUTH_REQUIRED when the admin signed in more than 10 minutes ago', async () => {
    const admin = await signIn(app, STALE_SIGN_IN);
    const luke = await createUser('Luke');

    const response = await removeUser(admin, luke.id);

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'REAUTH_REQUIRED' });
    expect(await prisma.user.count({ where: { id: luke.id } })).toBe(1);
  });

  it('returns 403 ADMIN_ONLY when a member asks', async () => {
    const member = await signIn(app, { role: 'MEMBER' });
    const luke = await createUser('Luke');

    const response = await removeUser(member, luke.id);

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('returns 404 when the user does not exist', async () => {
    const admin = await signIn(app);

    const response = await removeUser(admin, 999_999);

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});
