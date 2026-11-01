// An admin creates users with an app-made temporary password (docs/adr/0002-passwords-next-to-passkeys.md).
import { buildApp, type App } from '../../../app.ts';
import { prisma } from '../../../lib/prisma.ts';
import { SESSION_COOKIE_NAME } from '../../../lib/sessionCookie.ts';
import { resetTestDb } from '../../../testDb.ts';
import { createCollection, createUser, signIn, type SignedInClient } from '../../../testFixtures.ts';
import { isCommonPassword } from '../../auth/password/password.commonPasswords.ts';

type CreatedUser = { user: { id: number; username: string; role: string; state: string }; temporaryPassword: string };
type UserRow = { id: number; name: string; username: string | null; role: string; state: string };
type Page<Row> = { data: Row[]; totalResultNumber: number; currentPage: number };
type Named = { name: string; isDefault: boolean };

const URL = '/users';
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const NEW_PASSWORD = 'a shelf of tiny vinyl heads';
let addressCounter = 0;

let app: App;

// Password sign-in is rate limited per address: each sign-in here speaks from its own.
function nextAddress(): string {
  addressCounter += 1;

  return `10.2.${Math.floor(addressCounter / 250)}.${addressCounter % 250}`;
}

function tokenOf(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const cookie = cookies.find((candidate) => candidate.startsWith(`${SESSION_COOKIE_NAME}=`)) ?? '';

  return cookie.slice(SESSION_COOKIE_NAME.length + 1).split(';')[0] ?? '';
}

async function addUser(admin: SignedInClient, payload: object = { username: 'luke', role: 'MEMBER' }) {
  return admin.inject({ method: 'POST', url: URL, payload });
}

async function signInWithPassword(username: string, password: string) {
  return app.inject({
    method: 'POST',
    url: '/auth/login/password',
    remoteAddress: nextAddress(),
    payload: { username, password },
  });
}

function asToken(token: string) {
  return (options: { method: 'GET' | 'PUT'; url: string; payload?: object }) =>
    app.inject({ ...options, cookies: { [SESSION_COOKIE_NAME]: token } });
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

describe('POST /users', () => {
  it('creates a member with an app-made temporary password that meets the strength rule when an admin asks', async () => {
    const admin = await signIn(app);

    const response = await addUser(admin, { username: ' Luke ', role: 'MEMBER' });

    expect(response.statusCode).toBe(201);
    const { user, temporaryPassword } = response.json<CreatedUser>();
    expect(user).toMatchObject({ username: 'luke', role: 'MEMBER', state: 'TEMPORARY_PASSWORD' });
    expect(temporaryPassword.length).toBeGreaterThanOrEqual(15);
    expect(isCommonPassword(temporaryPassword)).toBe(false);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
    expect(row.passwordHash).toMatch(/^\$argon2id\$/);
    expect(row.passwordHash).not.toContain(temporaryPassword);
  });

  it('makes a different temporary password each time when two users are created', async () => {
    const admin = await signIn(app);

    const first = await addUser(admin, { username: 'luke', role: 'MEMBER' });
    const second = await addUser(admin, { username: 'leia', role: 'ADMIN' });

    expect(first.json<CreatedUser>().temporaryPassword).not.toBe(second.json<CreatedUser>().temporaryPassword);
    expect(second.json<CreatedUser>().user.role).toBe('ADMIN');
  });

  it('dates the temporary password to stop working 7 days after it was made when a user is created', async () => {
    const admin = await signIn(app);
    const before = Date.now();

    const response = await addUser(admin);

    const { id } = response.json<CreatedUser>().user;
    const row = await prisma.user.findUniqueOrThrow({ where: { id }, select: { temporaryPasswordExpiresAt: true } });
    const expiresInMs = (row.temporaryPasswordExpiresAt?.getTime() ?? 0) - before;
    expect(expiresInMs).toBeGreaterThanOrEqual(7 * DAY_MS);
    expect(expiresInMs).toBeLessThan(7 * DAY_MS + MINUTE_MS);
  });

  it('returns 403 REAUTH_REQUIRED when the admin signed in more than 10 minutes ago', async () => {
    const admin = await signIn(app, { signedInAt: new Date(Date.now() - 11 * MINUTE_MS) });

    const response = await addUser(admin);

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'REAUTH_REQUIRED' });
    expect(await prisma.user.count({ where: { username: 'luke' } })).toBe(0);
  });

  it('returns 403 ADMIN_ONLY when a member asks', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await addUser(member);

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('returns 409 when another user already has the username, whatever its case', async () => {
    const admin = await signIn(app);
    await addUser(admin, { username: 'luke', role: 'MEMBER' });

    const response = await addUser(admin, { username: 'LUKE', role: 'ADMIN' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT' });
  });

  it('returns 400 when the username, the role or a key is not allowed', async () => {
    const admin = await signIn(app);

    const answers = [
      await addUser(admin, { username: 'luke skywalker', role: 'MEMBER' }),
      await addUser(admin, { username: 'luke', role: 'OWNER' }),
      await addUser(admin, { username: 'luke', role: 'MEMBER', password: 'my own choice of password' }),
    ];

    expect(answers.map((answer) => answer.statusCode)).toEqual([400, 400, 400]);
  });

  it('gives the new user their own default "Owned" and "Wishlist" and none of the admin’s collections', async () => {
    const admin = await signIn(app);
    await createCollection({ name: 'Admin shelf', userId: admin.userId });
    const { user, temporaryPassword } = (await addUser(admin)).json<CreatedUser>();
    const signedIn = await signInWithPassword(user.username, temporaryPassword);
    const asLuke = asToken(tokenOf(signedIn.headers['set-cookie']));
    await asLuke({ method: 'PUT', url: '/auth/password', payload: { username: 'luke', password: NEW_PASSWORD } });

    const response = await asLuke({ method: 'GET', url: '/collections?sorting_fields=NAME' });

    expect(response.statusCode).toBe(200);
    const names = response.json<Page<Named>>().data.map(({ name, isDefault }) => ({ name, isDefault }));
    expect(names).toEqual([
      { name: 'Owned', isDefault: true },
      { name: 'Wishlist', isDefault: false },
    ]);
  });
});

describe('GET /users', () => {
  it('lists every user with their role and state, sorted by username, when an admin asks', async () => {
    const admin = await signIn(app);
    await prisma.user.update({ where: { id: admin.userId }, data: { username: 'mario' } });
    const leia = (await addUser(admin, { username: 'leia', role: 'ADMIN' })).json<CreatedUser>().user;
    await prisma.user.update({
      where: { id: leia.id },
      data: { temporaryPasswordExpiresAt: new Date(Date.now() - MINUTE_MS) },
    });
    await addUser(admin, { username: 'luke', role: 'MEMBER' });
    await createUser('Nobody yet');

    const response = await admin.inject({ method: 'GET', url: `${URL}?sorting_fields=USERNAME` });

    expect(response.statusCode).toBe(200);
    const page = response.json<Page<UserRow>>();
    expect(page.data.map(({ username, role, state }) => ({ username, role, state }))).toEqual([
      { username: 'leia', role: 'ADMIN', state: 'TEMPORARY_PASSWORD_EXPIRED' },
      { username: 'luke', role: 'MEMBER', state: 'TEMPORARY_PASSWORD' },
      { username: 'mario', role: 'ADMIN', state: 'ACTIVE' },
      { username: null, role: 'MEMBER', state: 'NO_SIGN_IN' },
    ]);
    expect(page.totalResultNumber).toBe(4);
  });

  it('never shows a temporary password again when the list is read after creating a user', async () => {
    const admin = await signIn(app);
    const { temporaryPassword } = (await addUser(admin)).json<CreatedUser>();

    const response = await admin.inject({ method: 'GET', url: URL });

    expect(response.body).not.toContain(temporaryPassword);
    expect(response.body).not.toContain('"temporaryPassword"');
    expect(response.body).not.toContain('passwordHash');
  });

  it('returns 403 ADMIN_ONLY when a member asks', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await member.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('returns 400 when the sort field is unknown', async () => {
    const admin = await signIn(app);

    const response = await admin.inject({ method: 'GET', url: `${URL}?sorting_fields=PASSWORD` });

    expect(response.statusCode).toBe(400);
  });
});
