// Signing in with a temporary password an admin made (docs/adr/0002-passwords-next-to-passkeys.md): it works for
// 7 days if unused, and must be replaced before anything else.
import { buildApp, type App } from '../../../app.ts';
import { prisma } from '../../../lib/prisma.ts';
import { SESSION_COOKIE_NAME } from '../../../lib/sessionCookie.ts';
import { resetTestDb } from '../../../testDb.ts';
import { signIn } from '../../../testFixtures.ts';

type CreatedUser = { user: { id: number; username: string }; temporaryPassword: string };
type Injected = { method: string; url: string; payload?: object };

const USERNAME = 'luke';
const NEW_PASSWORD = 'a shelf of tiny vinyl heads';
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
let addressCounter = 0;

let app: App;

// Password sign-in is rate limited per address: each sign-in here speaks from its own.
function nextAddress(): string {
  addressCounter += 1;

  return `10.3.${Math.floor(addressCounter / 250)}.${addressCounter % 250}`;
}

function tokenOf(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const cookie = cookies.find((candidate) => candidate.startsWith(`${SESSION_COOKIE_NAME}=`)) ?? '';

  return cookie.slice(SESSION_COOKIE_NAME.length + 1).split(';')[0] ?? '';
}

function signInWithPassword(password: string, username = USERNAME) {
  return app.inject({
    method: 'POST',
    url: '/auth/login/password',
    remoteAddress: nextAddress(),
    payload: { username, password },
  });
}

function asToken(token: string) {
  return (options: Injected) =>
    app.inject({ ...options, method: options.method as 'GET', cookies: { [SESSION_COOKIE_NAME]: token } });
}

// An admin creates "luke"; returns the temporary password the admin was shown.
async function createdUser(): Promise<CreatedUser> {
  const admin = await signIn(app);
  const response = await admin.inject({
    method: 'POST',
    url: '/users',
    payload: { username: USERNAME, role: 'MEMBER' },
  });

  expect(response.statusCode).toBe(201);

  return response.json<CreatedUser>();
}

// Luke signed in with the temporary password: the token of that session.
async function temporarySession(): Promise<string> {
  const { temporaryPassword } = await createdUser();
  const response = await signInWithPassword(temporaryPassword);

  expect(response.statusCode).toBe(200);

  return tokenOf(response.headers['set-cookie']);
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

describe('POST /auth/login/password', () => {
  it('signs in and says the password must be changed when the user signs in with a temporary password', async () => {
    const { temporaryPassword } = await createdUser();

    const response = await signInWithPassword(temporaryPassword);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: { name: USERNAME, username: USERNAME, role: 'MEMBER', isReadOnly: false, mustChangePassword: true },
    });
    const status = await asToken(tokenOf(response.headers['set-cookie']))({ method: 'GET', url: '/auth/status' });
    expect(status.json()).toMatchObject({ state: 'signedIn', user: { mustChangePassword: true } });
  });

  it('still signs in when the temporary password is a minute short of 7 days old', async () => {
    const { user, temporaryPassword } = await createdUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { temporaryPasswordExpiresAt: new Date(Date.now() + MINUTE_MS) },
    });

    const response = await signInWithPassword(temporaryPassword);

    expect(response.statusCode).toBe(200);
  });

  it('returns 401 TEMPORARY_PASSWORD_EXPIRED when the temporary password went unused for 7 days', async () => {
    const { user, temporaryPassword } = await createdUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { temporaryPasswordExpiresAt: new Date(Date.now() - DAY_MS) },
    });

    const response = await signInWithPassword(temporaryPassword);

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'TEMPORARY_PASSWORD_EXPIRED' });
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('returns 401 SIGN_IN_FAILED and says nothing about the expiry when the password is wrong', async () => {
    const { user } = await createdUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { temporaryPasswordExpiresAt: new Date(Date.now() - DAY_MS) },
    });

    const response = await signInWithPassword('not the temporary password at all');

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'SIGN_IN_FAILED' });
  });
});

describe('GET /uploads/* with a temporary password', () => {
  it('returns 403 PASSWORD_CHANGE_REQUIRED for an image file', async () => {
    const token = await temporarySession();

    const response = await asToken(token)({ method: 'GET', url: '/uploads/funkos/1/photo.sm.webp' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED' });
  });
});

describe('POST /auth/logout with a temporary password', () => {
  it('signs out with 204 when the user leaves without changing it', async () => {
    const token = await temporarySession();

    const response = await asToken(token)({ method: 'POST', url: '/auth/logout' });

    expect(response.statusCode).toBe(204);
  });
});

describe('PUT /auth/password with a temporary password', () => {
  it('opens the app and kills the temporary password when the user replaces it', async () => {
    const { temporaryPassword } = await createdUser();
    const token = tokenOf((await signInWithPassword(temporaryPassword)).headers['set-cookie']);
    const asLuke = asToken(token);

    const response = await asLuke({
      method: 'PUT',
      url: '/auth/password',
      payload: { username: USERNAME, password: NEW_PASSWORD },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ user: { mustChangePassword: false } });
    expect((await asLuke({ method: 'GET', url: '/collections' })).statusCode).toBe(200);
    expect((await signInWithPassword(temporaryPassword)).statusCode).toBe(401);
    expect((await signInWithPassword(NEW_PASSWORD)).statusCode).toBe(200);
  });

  it('returns 400 PASSWORD_REUSED when the new password is the temporary one', async () => {
    const { temporaryPassword } = await createdUser();
    const token = tokenOf((await signInWithPassword(temporaryPassword)).headers['set-cookie']);

    const response = await asToken(token)({
      method: 'PUT',
      url: '/auth/password',
      payload: { username: USERNAME, password: temporaryPassword },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'PASSWORD_REUSED' });
  });
});
