// "Confirm it's you" with a password: the signed-in user's own password refreshes the session's recent sign-in, the
// way a passkey sign-in does (docs/adr/0002-passwords-next-to-passkeys.md).
import { buildApp, type App } from '../../app.ts';
import { hashPassword } from '../../lib/passwordHash.ts';
import { prisma } from '../../lib/prisma.ts';
import { SESSION_COOKIE_NAME } from '../../lib/sessionCookie.ts';
import { resetTestDb } from '../../testDb.ts';
import { signIn, type SignedInClient } from '../../testFixtures.ts';

const URL = '/auth/recent-sign-in';
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const USERNAME = 'mario';
const PASSWORD = 'shelves full of tiny heads';
const OTHER_PASSWORD = 'a different shelf of heads';
// Confirming with a password allows this many tries a minute per address, like signing in with one.
const PASSWORD_LIMIT = 5;
const STALE_SIGN_IN_MS = 11 * MINUTE_MS;
let addressCounter = 0;

let app: App;

// The rate limit counts per address: each request speaks from its own unless a test says otherwise.
function nextAddress(): string {
  addressCounter += 1;

  return `10.4.${Math.floor(addressCounter / 250)}.${addressCounter % 250}`;
}

function tokenOf(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const cookie = cookies.find((candidate) => candidate.startsWith(`${SESSION_COOKIE_NAME}=`)) ?? '';

  return cookie.slice(SESSION_COOKIE_NAME.length + 1).split(';')[0] ?? '';
}

function confirm(api: SignedInClient, password: string, remoteAddress = nextAddress()) {
  return api.inject({ method: 'POST', url: URL, remoteAddress, payload: { password } });
}

function getTags(token: string) {
  return app.inject({ method: 'GET', url: '/tags', cookies: { [SESSION_COOKIE_NAME]: token } });
}

// Adding a passkey is one of the changes that needs a sign-in from the last 10 minutes.
function startAddPasskey(token: string) {
  return app.inject({ method: 'POST', url: '/auth/passkeys/options', cookies: { [SESSION_COOKIE_NAME]: token } });
}

async function givePassword(userId: number, password: string, username = USERNAME): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { username, passwordHash: await hashPassword(password) } });
}

// The test admin, with USERNAME and PASSWORD, signed in (with a passkey) more than 10 minutes ago.
async function staleOwnerWithPassword(): Promise<SignedInClient> {
  const api = await signIn(app, { signedInAt: new Date(Date.now() - STALE_SIGN_IN_MS) });
  await givePassword(api.userId, PASSWORD);

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

describe('POST /auth/recent-sign-in', () => {
  it('replaces the session with a fresh password one, so changes that need a recent sign-in work again', async () => {
    const api = await staleOwnerWithPassword();
    expect((await startAddPasskey(api.token)).statusCode).toBe(403);

    const response = await confirm(api, PASSWORD);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: { name: 'Tester', username: USERNAME, role: 'ADMIN', isReadOnly: false, mustChangePassword: false },
    });
    const newToken = tokenOf(response.headers['set-cookie']);
    expect((await startAddPasskey(newToken)).statusCode).toBe(200);
    expect((await getTags(api.token)).statusCode).toBe(401);
    const session = await prisma.session.findFirstOrThrow({ select: { signInMethod: true, passkeyId: true } });
    expect(session).toEqual({ signInMethod: 'PASSWORD', passkeyId: null });
  });

  it('gives the same 401 SIGN_IN_FAILED for a wrong password and for a user with no password, and keeps the session', async () => {
    const withPassword = await staleOwnerWithPassword();
    const passkeyOnly = await signIn(app, { role: 'MEMBER' });

    const answers = [await confirm(withPassword, `${PASSWORD}!`), await confirm(passkeyOnly, PASSWORD)];

    const bodies = answers.map((answer) => ({ status: answer.statusCode, body: answer.json<unknown>() }));
    expect(new Set(bodies.map((body) => JSON.stringify(body))).size).toBe(1);
    expect(bodies[0]).toEqual({
      status: 401,
      body: { code: 'SIGN_IN_FAILED', message: "That password doesn't match. Try again." },
    });
    expect(answers.some((answer) => answer.headers['set-cookie'])).toBe(false);
    expect((await getTags(withPassword.token)).statusCode).toBe(200);
    expect((await startAddPasskey(withPassword.token)).statusCode).toBe(403);
  });

  it('never switches users: another user’s password is a wrong password', async () => {
    const api = await staleOwnerWithPassword();
    const other = await prisma.user.create({ data: { name: 'Other', webauthnUserId: 'b3RoZXI' } });
    await givePassword(other.id, OTHER_PASSWORD, 'other');

    const response = await confirm(api, OTHER_PASSWORD);

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'SIGN_IN_FAILED' });
    expect(await prisma.session.count({ where: { userId: other.id } })).toBe(0);
  });

  it('returns 429 after 5 tries a minute from one address, and never locks the account', async () => {
    const api = await staleOwnerWithPassword();
    const remoteAddress = nextAddress();

    const responses = [];
    for (let attempt = 0; attempt <= PASSWORD_LIMIT; attempt += 1) {
      responses.push(await confirm(api, 'wrong password, sorry', remoteAddress));
    }

    expect(responses.at(-1)?.statusCode).toBe(429);
    const fromElsewhere = await confirm(api, PASSWORD);
    expect(fromElsewhere.statusCode).toBe(200);
  });

  it('confirms a temporary-password session with that temporary password, which still has to be replaced', async () => {
    const api = await signIn(app, { role: 'MEMBER', signedInAt: new Date(Date.now() - STALE_SIGN_IN_MS) });
    await givePassword(api.userId, PASSWORD, 'luke');
    await prisma.user.update({
      where: { id: api.userId },
      data: { temporaryPasswordExpiresAt: new Date(Date.now() + DAY_MS) },
    });

    const response = await confirm(api, PASSWORD);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ user: { username: 'luke', mustChangePassword: true } });
    const newToken = tokenOf(response.headers['set-cookie']);
    expect((await getTags(newToken)).json()).toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED' });
  });

  it('returns 401 TEMPORARY_PASSWORD_EXPIRED for the right temporary password after its 7 days', async () => {
    const api = await signIn(app, { role: 'MEMBER', signedInAt: new Date(Date.now() - STALE_SIGN_IN_MS) });
    await givePassword(api.userId, PASSWORD, 'luke');
    await prisma.user.update({ where: { id: api.userId }, data: { temporaryPasswordExpiresAt: new Date() } });

    const response = await confirm(api, PASSWORD);

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'TEMPORARY_PASSWORD_EXPIRED' });
  });

  it('returns 400 when the body has no password', async () => {
    const api = await staleOwnerWithPassword();

    const response = await api.inject({ method: 'POST', url: URL, remoteAddress: nextAddress(), payload: {} });

    expect(response.statusCode).toBe(400);
  });

  it('returns 401 without a session', async () => {
    const response = await app.inject({ method: 'POST', url: URL, payload: { password: PASSWORD } });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
