import { buildApp, type App } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';
import { SESSION_COOKIE_NAME } from '../../lib/sessionCookie.ts';
import { resetTestDb } from '../../testDb.ts';
import { signIn, type SignedInClient } from '../../testFixtures.ts';

const URL = '/auth';
const MINUTE_MS = 60 * 1000;
const USERNAME = 'mario';
const PASSWORD = 'shelves full of tiny heads';
// Password sign-in allows this many tries a minute per address.
const PASSWORD_LIMIT = 5;
let addressCounter = 0;

let app: App;

// The rate limit counts per address: each request speaks from its own unless a test says otherwise.
function nextAddress(): string {
  addressCounter += 1;

  return `10.1.${Math.floor(addressCounter / 250)}.${addressCounter % 250}`;
}

function tokenOf(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const cookie = cookies.find((candidate) => candidate.startsWith(`${SESSION_COOKIE_NAME}=`)) ?? '';

  return cookie.slice(SESSION_COOKIE_NAME.length + 1).split(';')[0] ?? '';
}

function setPassword(api: SignedInClient, payload: object) {
  return api.inject({ method: 'PUT', url: `${URL}/password`, payload });
}

function signInWithPassword(payload: object, options: { remoteAddress?: string; token?: string } = {}) {
  return app.inject({
    method: 'POST',
    url: `${URL}/login/password`,
    remoteAddress: options.remoteAddress ?? nextAddress(),
    cookies: options.token ? { [SESSION_COOKIE_NAME]: options.token } : {},
    payload,
  });
}

function getTags(token: string) {
  return app.inject({ method: 'GET', url: '/tags', cookies: { [SESSION_COOKIE_NAME]: token } });
}

// A signed-in owner who has set USERNAME and PASSWORD.
async function ownerWithPassword(): Promise<SignedInClient> {
  const api = await signIn(app);
  const response = await setPassword(api, { username: USERNAME, password: PASSWORD });

  expect(response.statusCode).toBe(200);

  return api;
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

describe('PUT /auth/password', () => {
  it('stores the username lower-case and the password only as an argon2id hash', async () => {
    const api = await signIn(app);

    const response = await setPassword(api, { username: ' Mario ', password: PASSWORD });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: { name: 'Tester', username: USERNAME, role: 'ADMIN', mustChangePassword: false },
    });
    const user = await prisma.user.findFirstOrThrow({ select: { username: true, passwordHash: true } });
    expect(user.username).toBe(USERNAME);
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user.passwordHash).not.toContain(PASSWORD);
    const status = await api.inject({ method: 'GET', url: `${URL}/status` });
    expect(status.json()).toEqual({
      state: 'signedIn',
      user: { name: 'Tester', username: USERNAME, role: 'ADMIN', mustChangePassword: false },
    });
  });

  it('returns 400 when the password is shorter than 15 characters', async () => {
    const api = await signIn(app);

    const response = await setPassword(api, { username: USERNAME, password: 'fourteen chars' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(JSON.stringify(response.json())).toContain('at least 15 characters');
  });

  it('returns 400 COMMON_PASSWORD when the password is on the common list, whatever its case', async () => {
    const api = await signIn(app);

    const response = await setPassword(api, { username: USERNAME, password: 'Password12345678' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'COMMON_PASSWORD' });
  });

  it('returns 400 when the username has characters other than letters, digits, dots, dashes and underscores', async () => {
    const api = await signIn(app);

    const response = await setPassword(api, { username: 'mario vieira', password: PASSWORD });

    expect(response.statusCode).toBe(400);
  });

  it('returns 403 REAUTH_REQUIRED when the sign-in is older than 10 minutes', async () => {
    const api = await signIn(app, { signedInAt: new Date(Date.now() - 11 * MINUTE_MS) });

    const response = await setPassword(api, { username: USERNAME, password: PASSWORD });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'REAUTH_REQUIRED' });
  });

  it('returns 409 when another user already has the username', async () => {
    const api = await signIn(app);
    await prisma.user.create({ data: { name: 'Other', webauthnUserId: 'b3RoZXI', username: USERNAME } });

    const response = await setPassword(api, { username: USERNAME, password: PASSWORD });

    expect(response.statusCode).toBe(409);
  });

  it('ends the other password sessions and keeps this one and the passkey ones when the password changes', async () => {
    const api = await ownerWithPassword();
    const passwordSession = tokenOf(
      (await signInWithPassword({ username: USERNAME, password: PASSWORD })).headers['set-cookie'],
    );
    const passkeySession = await signIn(app);

    const response = await setPassword(api, { username: USERNAME, password: `${PASSWORD} and more` });

    expect(response.statusCode).toBe(200);
    expect((await getTags(passwordSession)).statusCode).toBe(401);
    expect((await getTags(passkeySession.token)).statusCode).toBe(200);
    expect((await getTags(api.token)).statusCode).toBe(200);
  });

  it('returns 401 without a session', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `${URL}/password`,
      payload: { username: USERNAME, password: PASSWORD },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /auth/login/password', () => {
  it('signs in with a new session that replaces the browser’s old one when the password is right', async () => {
    const api = await ownerWithPassword();

    const response = await signInWithPassword({ username: 'MARIO', password: PASSWORD }, { token: api.token });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: { name: 'Tester', username: USERNAME, role: 'ADMIN', mustChangePassword: false },
    });
    const newToken = tokenOf(response.headers['set-cookie']);
    expect((await getTags(newToken)).statusCode).toBe(200);
    expect((await getTags(api.token)).statusCode).toBe(401);
    const session = await prisma.session.findFirstOrThrow({
      where: { passkeyId: null },
      select: { signInMethod: true },
    });
    expect(session.signInMethod).toBe('PASSWORD');
  });

  it('gives the same 401 SIGN_IN_FAILED for a wrong password, an unknown username and a user with no password', async () => {
    await ownerWithPassword();
    await prisma.user.create({ data: { name: 'Passkey only', webauthnUserId: 'cGFzc2tleQ', username: 'keys' } });

    const answers = [
      await signInWithPassword({ username: USERNAME, password: `${PASSWORD}!` }),
      await signInWithPassword({ username: 'nobody', password: PASSWORD }),
      await signInWithPassword({ username: 'keys', password: PASSWORD }),
    ];

    const bodies = answers.map((answer) => ({ status: answer.statusCode, body: answer.json<unknown>() }));
    expect(new Set(bodies.map((body) => JSON.stringify(body))).size).toBe(1);
    expect(bodies[0]).toEqual({
      status: 401,
      body: { code: 'SIGN_IN_FAILED', message: "That username and password don't match. Try again." },
    });
    expect(answers.some((answer) => answer.headers['set-cookie'])).toBe(false);
  });

  it('returns 429 after 5 tries a minute from one address, and never locks the account', async () => {
    await ownerWithPassword();
    const remoteAddress = nextAddress();

    const responses = [];
    for (let attempt = 0; attempt <= PASSWORD_LIMIT; attempt += 1) {
      responses.push(
        await signInWithPassword({ username: USERNAME, password: 'wrong password, sorry' }, { remoteAddress }),
      );
    }

    expect(responses.at(-1)?.statusCode).toBe(429);
    const fromElsewhere = await signInWithPassword({ username: USERNAME, password: PASSWORD });
    expect(fromElsewhere.statusCode).toBe(200);
  });
});
