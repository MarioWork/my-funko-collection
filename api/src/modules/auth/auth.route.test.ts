import type { InjectOptions } from 'fastify';
import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import { SESSION_COOKIE_NAME } from '../../lib/sessionCookie.ts';
import {
  createFunko,
  createPasskeyRow,
  createTag,
  createUser,
  makeImage,
  signIn,
  toFormData,
} from '../../testFixtures.ts';
import type { AuthenticationOptionsResponse, RegistrationOptionsResponse } from './auth.schema.ts';
import { addSetupCode, deleteSignIns } from './auth.service.ts';
import { TestPasskey } from './TestPasskey.ts';

const URL = '/auth';
const OWNER_NAME = 'Mario';
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const OTHER_ORIGIN = 'https://evil.example';
// The ceremony routes allow this many requests a minute per address.
const CEREMONY_LIMIT = 10;
// Fewer than this many locked routes would mean the OpenAPI walk missed most of the API.
const MIN_LOCKED_ROUTES = 30;
// Routes anyone may call without a session; everything else must answer 401.
const PUBLIC_ROUTES = new Set([
  'GET /health',
  'GET /ready',
  'GET /auth/status',
  'POST /auth/setup/options',
  'POST /auth/setup/verify',
  'POST /auth/login/options',
  'POST /auth/login/verify',
  'POST /auth/login/password',
  'POST /auth/logout',
]);
// The routes a session signed in with a temporary password may call besides the public ones: replacing it (and
// confirming it's them first), and signing out. Every other route answers 403 PASSWORD_CHANGE_REQUIRED to it.
const ALLOWED_WITH_TEMPORARY_PASSWORD = new Set([
  'PUT /auth/password',
  'POST /auth/recent-sign-in',
  'POST /auth/logout',
  'POST /auth/logout-everywhere',
]);
// The writes a read-only user may still make besides the public ones: their own password and passkeys (and
// confirming it's them first), and signing out. Every other write answers 403 READ_ONLY to them; reads stay open.
const ALLOWED_WHEN_READ_ONLY = new Set([
  'PUT /auth/password',
  'POST /auth/recent-sign-in',
  'POST /auth/logout',
  'POST /auth/logout-everywhere',
  'POST /auth/passkeys/options',
  'POST /auth/passkeys/verify',
  'DELETE /auth/passkeys/{passkeyId}',
]);
// Fewer than this many refused writes would mean the OpenAPI walk missed most of the API's writes.
const MIN_READ_ONLY_REFUSED_WRITES = 25;
// The paths under which every write changes the catalogue, so every write there must be admin-only or a submission
// route below.
const CATALOGUE_PATH_PREFIXES = ['/funkos', '/categories', '/series'];
// Routes only an admin may call: changing a category or series, the images lists and the users. A member gets 403
// ADMIN_ONLY on these from the route gate, and never on any other route without a funko of the catalogue.
const ADMIN_ONLY_ROUTES = new Set([
  'PATCH /categories/{categoryId}',
  'DELETE /categories/{categoryId}',
  'PATCH /series/{seriesId}',
  'DELETE /series/{seriesId}',
  'GET /images',
  'GET /images/groups',
  'GET /export/images.csv',
  'GET /export/images.json',
  'GET /export/images.xlsx',
  'GET /users',
  'POST /users',
  'PATCH /users/{userId}',
  'POST /users/{userId}/temporary-password',
  'DELETE /users/{userId}',
]);
// Catalogue writes open to members, for their submissions: a member's new funko, category or series waits for an
// admin, and a member changes only their own waiting funko and its images. The service refuses a funko of the
// catalogue with the same 403 ADMIN_ONLY (checked below with a body each route accepts).
const SUBMISSION_ROUTES = new Set([
  'POST /categories',
  'POST /series',
  'POST /funkos',
  'PATCH /funkos/{funkoId}',
  'DELETE /funkos/{funkoId}',
  'POST /funkos/{funkoId}/images',
  'POST /funkos/{funkoId}/images/from-url',
  'PATCH /funkos/{funkoId}/images/order',
  'POST /funkos/{funkoId}/images/{imageId}/rotate',
  'DELETE /funkos/{funkoId}/images/{imageId}',
]);
// The submission routes that change one funko, each with a body it accepts, so the request reaches the service.
const FUNKO_WRITE_BODIES: Record<string, () => Promise<Pick<InjectOptions, 'payload'>>> = {
  'PATCH /funkos/{funkoId}': async () => ({ payload: { name: 'Renamed' } }),
  'DELETE /funkos/{funkoId}': async () => ({}),
  'POST /funkos/{funkoId}/images': async () => ({ payload: toFormData([{ buffer: await makeImage() }]) }),
  'POST /funkos/{funkoId}/images/from-url': async () => ({ payload: { url: 'https://example.com/photo.png' } }),
  'PATCH /funkos/{funkoId}/images/order': async () => ({ payload: { imageIds: [1] } }),
  'POST /funkos/{funkoId}/images/{imageId}/rotate': async () => ({ payload: { degrees: 90 } }),
  'DELETE /funkos/{funkoId}/images/{imageId}': async () => ({}),
};
// The rate limit counts per address: each test speaks from its own, so no test eats another's allowance.
let addressCounter = 0;

let app: App;

function nextAddress(): string {
  addressCounter += 1;

  return `10.0.${Math.floor(addressCounter / 250)}.${addressCounter % 250}`;
}

function isCataloguePath(path: string): boolean {
  return CATALOGUE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// A route as "METHOD /path": anything but a read changes something.
function isWriteRoute(route: string): boolean {
  return !route.startsWith('GET ');
}

function sessionCookieOf(setCookie: string | string[] | undefined): string | undefined {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];

  return cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));
}

function tokenOf(setCookie: string | string[] | undefined): string {
  const cookie = sessionCookieOf(setCookie) ?? '';

  return cookie.slice(SESSION_COOKIE_NAME.length + 1).split(';')[0] ?? '';
}

// The whole first-run ceremony: options with the code, the passkey answers, verify. Returns the session token.
async function setUp(passkey: TestPasskey, code: string): Promise<string> {
  const remoteAddress = nextAddress();
  const optionsResponse = await app.inject({
    method: 'POST',
    url: `${URL}/setup/options`,
    remoteAddress,
    payload: { code, name: OWNER_NAME },
  });
  const options = optionsResponse.json<RegistrationOptionsResponse>();
  const verifyResponse = await app.inject({
    method: 'POST',
    url: `${URL}/setup/verify`,
    remoteAddress,
    payload: { code, name: OWNER_NAME, passkeyName: 'iPhone', response: passkey.register(options) },
  });

  expect(verifyResponse.statusCode).toBe(200);

  return tokenOf(verifyResponse.headers['set-cookie']);
}

async function signInOptions(remoteAddress = nextAddress()): Promise<AuthenticationOptionsResponse> {
  const response = await app.inject({ method: 'POST', url: `${URL}/login/options`, remoteAddress });

  return response.json<AuthenticationOptionsResponse>();
}

function verifySignIn(response: unknown, cookies: Record<string, string> = {}) {
  return app.inject({
    method: 'POST',
    url: `${URL}/login/verify`,
    remoteAddress: nextAddress(),
    cookies,
    payload: { response },
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

describe('GET /auth/status', () => {
  it('answers setup when nobody has set the app up', async () => {
    const response = await app.inject({ method: 'GET', url: `${URL}/status` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ state: 'setup' });
  });

  it('answers signedOut when a user exists and the browser has no session', async () => {
    await signIn(app);

    const response = await app.inject({ method: 'GET', url: `${URL}/status` });

    expect(response.json()).toEqual({ state: 'signedOut' });
  });

  it('answers signedIn with the name when the browser has a session', async () => {
    const api = await signIn(app);

    const response = await api.inject({ method: 'GET', url: `${URL}/status` });

    expect(response.json()).toEqual({
      state: 'signedIn',
      user: { name: 'Tester', username: null, role: 'ADMIN', isReadOnly: false, mustChangePassword: false },
    });
  });

  it('answers the MEMBER role when a member is signed in', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await member.inject({ method: 'GET', url: `${URL}/status` });

    expect(response.json()).toEqual({
      state: 'signedIn',
      user: { name: 'Member', username: null, role: 'MEMBER', isReadOnly: false, mustChangePassword: false },
    });
  });

  it('marks the answer no-store when any API route answers, so no cache keeps the collection', async () => {
    const response = await app.inject({ method: 'GET', url: `${URL}/status` });

    expect(response.headers['cache-control']).toBe('no-store');
  });
});

describe('POST /auth/setup/verify', () => {
  it('saves the first passkey and signs in with a locked-down cookie when the setup code is right', async () => {
    const code = (await addSetupCode()) ?? '';
    const remoteAddress = nextAddress();
    const passkey = new TestPasskey();
    const optionsResponse = await app.inject({
      method: 'POST',
      url: `${URL}/setup/options`,
      remoteAddress,
      payload: { code, name: OWNER_NAME },
    });

    expect(optionsResponse.statusCode).toBe(200);
    const options = optionsResponse.json<RegistrationOptionsResponse>();
    expect(options).toMatchObject({
      rp: { id: 'localhost', name: 'My Funko Collection' },
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      attestation: 'none',
    });

    const verifyResponse = await app.inject({
      method: 'POST',
      url: `${URL}/setup/verify`,
      remoteAddress,
      payload: { code, name: OWNER_NAME, response: passkey.register(options) },
    });

    expect(verifyResponse.statusCode).toBe(200);
    expect(verifyResponse.json()).toEqual({
      user: { name: OWNER_NAME, username: null, role: 'ADMIN', isReadOnly: false, mustChangePassword: false },
    });
    const cookie = sessionCookieOf(verifyResponse.headers['set-cookie']) ?? '';
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/');

    const status = await app.inject({
      method: 'GET',
      url: `${URL}/status`,
      cookies: { [SESSION_COOKIE_NAME]: tokenOf(verifyResponse.headers['set-cookie']) },
    });
    expect(status.json()).toEqual({
      state: 'signedIn',
      user: { name: OWNER_NAME, username: null, role: 'ADMIN', isReadOnly: false, mustChangePassword: false },
    });
  });

  it('returns 401 PASSKEY_FAILED when the passkey was made for another site', async () => {
    const code = (await addSetupCode()) ?? '';
    const remoteAddress = nextAddress();
    const optionsResponse = await app.inject({
      method: 'POST',
      url: `${URL}/setup/options`,
      remoteAddress,
      payload: { code, name: OWNER_NAME },
    });
    const options = optionsResponse.json<RegistrationOptionsResponse>();

    const response = await app.inject({
      method: 'POST',
      url: `${URL}/setup/verify`,
      remoteAddress,
      payload: { code, name: OWNER_NAME, response: new TestPasskey().register(options, { origin: OTHER_ORIGIN }) },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'PASSKEY_FAILED' });
  });
});

describe('POST /auth/setup/options', () => {
  it('returns 401 INVALID_SETUP_CODE when the code is wrong', async () => {
    await addSetupCode();

    const response = await app.inject({
      method: 'POST',
      url: `${URL}/setup/options`,
      remoteAddress: nextAddress(),
      payload: { code: 'not-the-code', name: OWNER_NAME },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'INVALID_SETUP_CODE' });
  });

  it('returns 409 ALREADY_SET_UP when someone tries the used code again', async () => {
    const code = (await addSetupCode()) ?? '';
    await setUp(new TestPasskey(), code);

    const response = await app.inject({
      method: 'POST',
      url: `${URL}/setup/options`,
      remoteAddress: nextAddress(),
      payload: { code, name: 'Intruder' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'ALREADY_SET_UP' });
  });

  it('returns 400 when the body has an unknown key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `${URL}/setup/options`,
      remoteAddress: nextAddress(),
      payload: { code: 'x', name: OWNER_NAME, isAdmin: true },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /auth/login/options', () => {
  it('returns 409 NOT_SET_UP when nobody has set the app up', async () => {
    const response = await app.inject({ method: 'POST', url: `${URL}/login/options`, remoteAddress: nextAddress() });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'NOT_SET_UP' });
  });

  it('asks for any passkey the browser holds, with Face ID / Touch ID required, when the app is set up', async () => {
    await signIn(app);

    const options = await signInOptions();

    expect(options).toMatchObject({ rpId: 'localhost', userVerification: 'required' });
    expect(options).not.toHaveProperty('allowCredentials.0');
  });

  it('returns 429 when one address goes past the per-minute limit', async () => {
    await signIn(app);
    const remoteAddress = nextAddress();

    const responses = [];
    for (let attempt = 0; attempt <= CEREMONY_LIMIT; attempt += 1) {
      responses.push(await app.inject({ method: 'POST', url: `${URL}/login/options`, remoteAddress }));
    }

    expect(responses.at(-1)?.statusCode).toBe(429);
  });
});

describe('POST /auth/login/verify', () => {
  it('signs in with a new session and ends the browser’s old one when the passkey is right', async () => {
    const passkey = new TestPasskey();
    const firstToken = await setUp(passkey, (await addSetupCode()) ?? '');

    const response = await verifySignIn(passkey.authenticate(await signInOptions()), {
      [SESSION_COOKIE_NAME]: firstToken,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: { name: OWNER_NAME, username: null, role: 'ADMIN', isReadOnly: false, mustChangePassword: false },
    });
    const newToken = tokenOf(response.headers['set-cookie']);
    expect(newToken).not.toBe(firstToken);
    const oldSession = await app.inject({
      method: 'GET',
      url: '/tags',
      cookies: { [SESSION_COOKIE_NAME]: firstToken },
    });
    expect(oldSession.statusCode).toBe(401);
    const newSession = await app.inject({ method: 'GET', url: '/tags', cookies: { [SESSION_COOKIE_NAME]: newToken } });
    expect(newSession.statusCode).toBe(200);
  });

  it('returns 401 SIGN_IN_FAILED when the same signed answer is sent twice', async () => {
    const passkey = new TestPasskey();
    await setUp(passkey, (await addSetupCode()) ?? '');
    const answer = passkey.authenticate(await signInOptions());
    await verifySignIn(answer);

    const replay = await verifySignIn(answer);

    expect(replay.statusCode).toBe(401);
    expect(replay.json()).toMatchObject({ code: 'SIGN_IN_FAILED' });
  });

  it('returns 401 SIGN_IN_FAILED when the page asking was another site', async () => {
    const passkey = new TestPasskey();
    await setUp(passkey, (await addSetupCode()) ?? '');

    const response = await verifySignIn(passkey.authenticate(await signInOptions(), { origin: OTHER_ORIGIN }));

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'SIGN_IN_FAILED' });
  });

  it('returns 401 SIGN_IN_FAILED when the passkey belongs to another site name', async () => {
    const passkey = new TestPasskey();
    await setUp(passkey, (await addSetupCode()) ?? '');

    const response = await verifySignIn(passkey.authenticate(await signInOptions(), { rpId: 'evil.example' }));

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 SIGN_IN_FAILED when Face ID / Touch ID was skipped', async () => {
    const passkey = new TestPasskey();
    await setUp(passkey, (await addSetupCode()) ?? '');

    const response = await verifySignIn(passkey.authenticate(await signInOptions(), { isUserVerified: false }));

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 SIGN_IN_FAILED when the challenge was never handed out', async () => {
    const passkey = new TestPasskey();
    await setUp(passkey, (await addSetupCode()) ?? '');

    const response = await verifySignIn(passkey.authenticate({ challenge: 'bWFkZS11cA' }));

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 SIGN_IN_FAILED when the passkey is not one the app knows', async () => {
    await setUp(new TestPasskey(), (await addSetupCode()) ?? '');

    const response = await verifySignIn(new TestPasskey().authenticate(await signInOptions()));

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 SIGN_IN_FAILED when the passkey was removed by a reset', async () => {
    const passkey = new TestPasskey();
    await setUp(passkey, (await addSetupCode()) ?? '');
    const options = await signInOptions();
    await deleteSignIns();

    const response = await verifySignIn(passkey.authenticate(options));

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /auth/setup/verify after yarn auth:reset', () => {
  it('gives the first user a new passkey and keeps their collections when the app was reset', async () => {
    const token = await setUp(new TestPasskey(), (await addSetupCode()) ?? '');
    const cookies = { [SESSION_COOKIE_NAME]: token };
    const created = await app.inject({ method: 'POST', url: '/collections', cookies, payload: { name: 'For sale' } });
    expect(created.statusCode).toBe(201);
    await deleteSignIns();

    const status = await app.inject({ method: 'GET', url: `${URL}/status` });
    const newToken = await setUp(new TestPasskey(), (await addSetupCode()) ?? '');
    const collections = await app.inject({
      method: 'GET',
      url: '/collections',
      cookies: { [SESSION_COOKIE_NAME]: newToken },
    });

    expect(status.json()).toEqual({ state: 'setup' });
    expect(collections.json<{ data: { name: string }[] }>().data.map(({ name }) => name)).toEqual([
      'For sale',
      'Owned',
      'Wishlist',
    ]);
  });
});

describe('ANY /<every non-public route>', () => {
  it('returns 401 for every non-public route in the API when there is no session', async () => {
    const document = app.swagger() as { paths: Record<string, Record<string, unknown>> };
    const checked: string[] = [];

    for (const [path, operations] of Object.entries(document.paths)) {
      for (const method of Object.keys(operations)) {
        const route = `${method.toUpperCase()} ${path}`;

        if (PUBLIC_ROUTES.has(route)) continue;

        const url = path.replace(/\{[^}]+\}/g, '1');
        const response = await app.inject({ method: method.toUpperCase() as 'GET', url });

        expect({ route, status: response.statusCode }).toEqual({ route, status: 401 });
        checked.push(route);
      }
    }

    expect(checked.length).toBeGreaterThan(MIN_LOCKED_ROUTES);
  });
});

describe('ANY /<every admin-only route>', () => {
  it('returns 403 ADMIN_ONLY for every admin-only route, and for no other route, when a member calls it', async () => {
    const document = app.swagger() as { paths: Record<string, Record<string, unknown>> };
    const adminOnlySeen: string[] = [];

    for (const [path, operations] of Object.entries(document.paths)) {
      for (const method of Object.keys(operations)) {
        const route = `${method.toUpperCase()} ${path}`;

        if (PUBLIC_ROUTES.has(route)) continue;

        // A fresh session per call: logging out everywhere must not sign the next call out.
        const member = await signIn(app, { role: 'MEMBER' });
        const url = path.replace(/\{[^}]+\}/g, '1');
        const response = await member.inject({ method: method.toUpperCase(), url });
        const isAdminOnlyAnswer =
          response.statusCode === 403 && response.json<{ code: string }>().code === 'ADMIN_ONLY';

        expect({ route, isAdminOnlyAnswer }).toEqual({ route, isAdminOnlyAnswer: ADMIN_ONLY_ROUTES.has(route) });
        if (isAdminOnlyAnswer) adminOnlySeen.push(route);
      }
    }

    expect(adminOnlySeen.sort()).toEqual([...ADMIN_ONLY_ROUTES].sort());
  });

  it('lets the request through on every admin-only route when an admin calls it', async () => {
    for (const route of ADMIN_ONLY_ROUTES) {
      const [method = 'GET', path = '/'] = route.split(' ');
      const admin = await signIn(app);
      const url = path.replace(/\{[^}]+\}/g, '1');

      const response = await admin.inject({ method, url });

      expect({ route, status: response.statusCode }).not.toEqual({ route, status: 403 });
    }
  });

  // The admin gate is opt-in (`isAdminOnly` on the route), so a new catalogue write that forgets the flag would let
  // members change the catalogue. Every write under the catalogue paths must be admin-only or a submission route,
  // whose service checks the funko (below).
  it('puts every catalogue write behind the admin gate or a submission check when the app registers its routes', async () => {
    await app.ready();

    const document = app.swagger() as { paths: Record<string, Record<string, unknown>> };
    const catalogueWrites = Object.entries(document.paths)
      .filter(([path]) => isCataloguePath(path))
      .flatMap(([path, operations]) => Object.keys(operations).map((method) => `${method.toUpperCase()} ${path}`))
      .filter(isWriteRoute);

    const missingWrites = catalogueWrites.filter(
      (route) => !ADMIN_ONLY_ROUTES.has(route) && !SUBMISSION_ROUTES.has(route),
    );

    expect(catalogueWrites.length).toBeGreaterThan(0);
    expect(missingWrites).toEqual([]);
  });
});

describe('ANY /<every submission route that changes one funko>', () => {
  it('returns 403 ADMIN_ONLY and changes nothing when a member aims it at a funko of the catalogue', async () => {
    const funkoRoutes = [...SUBMISSION_ROUTES].filter((route) => route.includes('{funkoId}'));

    expect(Object.keys(FUNKO_WRITE_BODIES).sort()).toEqual(funkoRoutes.sort());

    for (const route of funkoRoutes) {
      const [method = 'GET', path = '/'] = route.split(' ');
      const funko = await createFunko({ name: 'Catalogue funko' });
      const member = await signIn(app, { role: 'MEMBER' });
      const url = path.replace('{funkoId}', String(funko.id)).replace('{imageId}', '1');
      const body = await FUNKO_WRITE_BODIES[route]?.();

      const response = await member.inject({ method, url, ...body });

      const code = response.statusCode === 403 ? response.json<{ code: string }>().code : undefined;
      expect({ route, code }).toEqual({ route, code: 'ADMIN_ONLY' });
      const admin = await signIn(app);
      const after = await admin.inject({ method: 'GET', url: `/funkos/${funko.id}` });
      expect(after.json()).toMatchObject({ name: 'Catalogue funko', images: [] });
    }
  });
});

describe('ANY /<every route> with a temporary password', () => {
  it('returns 403 PASSWORD_CHANGE_REQUIRED on every route but changing it, signing out and the public ones', async () => {
    const member = await signIn(app, { role: 'MEMBER', hasTemporaryPassword: true });
    const document = app.swagger() as { paths: Record<string, Record<string, unknown>> };
    const refused: string[] = [];

    for (const [path, operations] of Object.entries(document.paths)) {
      for (const method of Object.keys(operations)) {
        const route = `${method.toUpperCase()} ${path}`;
        const isAllowed = ALLOWED_WITH_TEMPORARY_PASSWORD.has(route) || PUBLIC_ROUTES.has(route);

        if (isAllowed) continue;

        const url = path.replace(/\{[^}]+\}/g, '1');
        const response = await member.inject({ method: method.toUpperCase(), url });
        const code = response.statusCode === 403 ? response.json<{ code: string }>().code : undefined;

        expect({ route, code }).toEqual({ route, code: 'PASSWORD_CHANGE_REQUIRED' });
        refused.push(route);
      }
    }

    expect(refused.length).toBeGreaterThan(MIN_LOCKED_ROUTES);
  });
});

describe('ANY /<every write route> when the user is read-only', () => {
  it.each(['MEMBER', 'ADMIN'] as const)(
    'returns 403 READ_ONLY on every write but their own password, passkeys and signing out when a read-only %s calls it',
    async (role) => {
      const user = await createUser('Read only', role);
      const readOnly = await signIn(app, { userId: user.id, isReadOnly: true });
      const document = app.swagger() as { paths: Record<string, Record<string, unknown>> };
      const refused: string[] = [];

      for (const [path, operations] of Object.entries(document.paths)) {
        for (const method of Object.keys(operations)) {
          const route = `${method.toUpperCase()} ${path}`;
          const isAllowed = ALLOWED_WHEN_READ_ONLY.has(route) || PUBLIC_ROUTES.has(route);

          if (!isWriteRoute(route) || isAllowed) continue;

          const url = path.replace(/\{[^}]+\}/g, '1');
          const response = await readOnly.inject({ method: method.toUpperCase(), url });
          const code = response.statusCode === 403 ? response.json<{ code: string }>().code : undefined;

          expect({ route, code }).toEqual({ route, code: 'READ_ONLY' });
          refused.push(route);
        }
      }

      expect(refused.length).toBeGreaterThan(MIN_READ_ONLY_REFUSED_WRITES);
    },
  );

  it('lets every allowed write through when a read-only user calls it', async () => {
    const user = await createUser('Read only');

    for (const route of ALLOWED_WHEN_READ_ONLY) {
      const [method = 'GET', path = '/'] = route.split(' ');
      // A fresh session per call: signing out must not sign the next call out.
      const readOnly = await signIn(app, { userId: user.id, isReadOnly: true });
      const url = path.replace(/\{[^}]+\}/g, '1');

      const response = await readOnly.inject({ method, url });

      const code = response.statusCode === 403 ? response.json<{ code: string }>().code : undefined;
      expect({ route, code }).not.toEqual({ route, code: 'READ_ONLY' });
    }
  });

  it('still answers the reads when a read-only user looks at their collections and the catalogue', async () => {
    const user = await createUser('Read only');
    const readOnly = await signIn(app, { userId: user.id, isReadOnly: true });

    const answers = [
      await readOnly.inject({ method: 'GET', url: '/collections' }),
      await readOnly.inject({ method: 'GET', url: '/funkos' }),
      await readOnly.inject({ method: 'GET', url: '/auth/status' }),
    ];

    expect(answers.map((answer) => answer.statusCode)).toEqual([200, 200, 200]);
    expect(answers[2]?.json()).toMatchObject({ state: 'signedIn', user: { isReadOnly: true } });
  });
});

describe('GET /uploads/*', () => {
  it('returns 401 for an image file when there is no session', async () => {
    const response = await app.inject({ method: 'GET', url: '/uploads/funkos/1/anything.webp' });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /tags', () => {
  it('returns 401 when the cookie holds a token the app never issued', async () => {
    await signIn(app);

    const response = await app.inject({ method: 'GET', url: '/tags', cookies: { [SESSION_COOKIE_NAME]: 'forged' } });

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 when the session is past its 30-day life', async () => {
    const api = await signIn(app, { signedInAt: new Date(Date.now() - 31 * DAY_MS), lastSeenAt: new Date() });

    const response = await api.inject({ method: 'GET', url: '/tags' });

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 when the session went unused for more than 7 days', async () => {
    const api = await signIn(app, { signedInAt: new Date(Date.now() - 8 * DAY_MS) });

    const response = await api.inject({ method: 'GET', url: '/tags' });

    expect(response.statusCode).toBe(401);
  });

  it('returns 200 when the session was opened by a password, without a passkey', async () => {
    const api = await signIn(app, { signInMethod: 'PASSWORD' });

    const response = await api.inject({ method: 'GET', url: '/tags' });

    expect(response.statusCode).toBe(200);
  });
});

describe('POST /tags', () => {
  it('returns 403 CROSS_SITE_REQUEST when another site makes the browser send a write', async () => {
    const api = await signIn(app);

    const response = await api.inject({
      method: 'POST',
      url: '/tags',
      headers: { 'sec-fetch-site': 'cross-site' },
      payload: { name: 'Box 9' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'CROSS_SITE_REQUEST' });
  });

  it('lets the app’s own page write when the request is same-origin', async () => {
    const api = await signIn(app);

    const response = await api.inject({
      method: 'POST',
      url: '/tags',
      headers: { 'sec-fetch-site': 'same-origin', origin: 'http://localhost:5173' },
      payload: { name: 'Box 9' },
    });

    expect(response.statusCode).toBe(201);
  });
});

describe('DELETE /tags/:id', () => {
  it('returns 403 CROSS_SITE_REQUEST when an older browser only sends a foreign Origin', async () => {
    const api = await signIn(app);

    const response = await api.inject({
      method: 'DELETE',
      url: `/tags/${(await createTag()).id}`,
      headers: { origin: OTHER_ORIGIN },
    });

    expect(response.statusCode).toBe(403);
  });
});

describe('POST /auth/logout', () => {
  it('ends this session, clears the cookie and the browser cache when signing out', async () => {
    const api = await signIn(app);

    const response = await api.inject({ method: 'POST', url: `${URL}/logout` });

    expect(response.statusCode).toBe(204);
    expect(sessionCookieOf(response.headers['set-cookie'])).toContain('Expires=Thu, 01 Jan 1970');
    expect(response.headers['clear-site-data']).toBe('"cache"');
    expect((await api.inject({ method: 'GET', url: '/tags' })).statusCode).toBe(401);
  });

  it('clears the cookie with 204 when the session has already expired', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `${URL}/logout`,
      cookies: { [SESSION_COOKIE_NAME]: 'expired-or-forged' },
    });

    expect(response.statusCode).toBe(204);
    expect(sessionCookieOf(response.headers['set-cookie'])).toContain('Expires=Thu, 01 Jan 1970');
  });
});

describe('POST /auth/logout-everywhere', () => {
  it('ends every session of the user when signing out everywhere', async () => {
    const phone = await signIn(app);
    const laptop = await signIn(app);

    const response = await phone.inject({ method: 'POST', url: `${URL}/logout-everywhere` });

    expect(response.statusCode).toBe(204);
    expect((await laptop.inject({ method: 'GET', url: '/tags' })).statusCode).toBe(401);
  });

  it('returns 401 when signing out everywhere without a session', async () => {
    const response = await app.inject({ method: 'POST', url: `${URL}/logout-everywhere` });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /auth/passkeys/verify', () => {
  it('lists, adds and removes passkeys when the sign-in is recent', async () => {
    const first = new TestPasskey();
    const token = await setUp(first, (await addSetupCode()) ?? '');
    const cookies = { [SESSION_COOKIE_NAME]: token };
    const second = new TestPasskey();

    const optionsResponse = await app.inject({ method: 'POST', url: `${URL}/passkeys/options`, cookies });
    const options = optionsResponse.json<RegistrationOptionsResponse>();
    expect(options).toMatchObject({ excludeCredentials: [{ id: first.credentialId }] });
    const added = await app.inject({
      method: 'POST',
      url: `${URL}/passkeys/verify`,
      cookies,
      payload: { name: 'Bitwarden', response: second.register(options) },
    });
    expect(added.statusCode).toBe(201);
    expect(added.json()).toMatchObject({ id: second.credentialId, name: 'Bitwarden', isSynced: true });

    const list = await app.inject({ method: 'GET', url: `${URL}/passkeys`, cookies });
    expect(
      list
        .json<{ data: { name: string }[] }>()
        .data.map((passkey) => passkey.name)
        .sort(),
    ).toEqual(['Bitwarden', 'iPhone']);

    const removed = await app.inject({ method: 'DELETE', url: `${URL}/passkeys/${first.credentialId}`, cookies });
    expect(removed.statusCode).toBe(204);
    const signInWithRemoved = await verifySignIn(first.authenticate(await signInOptions()));
    expect(signInWithRemoved.statusCode).toBe(401);
  });

  it('returns 400 PASSKEY_FAILED when the new passkey answers a challenge it was never given', async () => {
    const api = await signIn(app);

    const response = await api.inject({
      method: 'POST',
      url: `${URL}/passkeys/verify`,
      payload: { name: 'Stolen', response: new TestPasskey().register({ challenge: 'bWFkZS11cA' }) },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'PASSKEY_FAILED' });
  });
});

describe('DELETE /auth/passkeys/:passkeyId', () => {
  it('returns 409 LAST_PASSKEY when removing the only passkey', async () => {
    const passkey = new TestPasskey();
    const token = await setUp(passkey, (await addSetupCode()) ?? '');

    const response = await app.inject({
      method: 'DELETE',
      url: `${URL}/passkeys/${passkey.credentialId}`,
      cookies: { [SESSION_COOKIE_NAME]: token },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'LAST_PASSKEY' });
  });

  it('returns 403 REAUTH_REQUIRED when removing a passkey from a sign-in older than 10 minutes', async () => {
    const api = await signIn(app, { signedInAt: new Date(Date.now() - 11 * MINUTE_MS) });

    const response = await api.inject({ method: 'DELETE', url: `${URL}/passkeys/c29tZS1rZXk` });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'REAUTH_REQUIRED' });
  });

  it('ends the sessions a passkey opened when that passkey is removed', async () => {
    const first = new TestPasskey();
    const firstToken = await setUp(first, (await addSetupCode()) ?? '');
    const second = new TestPasskey();
    const options = await app.inject({
      method: 'POST',
      url: `${URL}/passkeys/options`,
      cookies: { [SESSION_COOKIE_NAME]: firstToken },
    });
    await app.inject({
      method: 'POST',
      url: `${URL}/passkeys/verify`,
      cookies: { [SESSION_COOKIE_NAME]: firstToken },
      payload: { name: 'Spare', response: second.register(options.json<RegistrationOptionsResponse>()) },
    });
    const secondSignIn = await verifySignIn(second.authenticate(await signInOptions()));
    const secondToken = tokenOf(secondSignIn.headers['set-cookie']);

    const removed = await app.inject({
      method: 'DELETE',
      url: `${URL}/passkeys/${first.credentialId}`,
      cookies: { [SESSION_COOKIE_NAME]: secondToken },
    });

    expect(removed.statusCode).toBe(204);
    const firstSession = await app.inject({
      method: 'GET',
      url: '/tags',
      cookies: { [SESSION_COOKIE_NAME]: firstToken },
    });
    expect(firstSession.statusCode).toBe(401);
    const secondSession = await app.inject({
      method: 'GET',
      url: '/tags',
      cookies: { [SESSION_COOKIE_NAME]: secondToken },
    });
    expect(secondSession.statusCode).toBe(200);
  });

  it('returns 204 and keeps the other sessions when the removed passkey did not open them', async () => {
    const passwordSession = await signIn(app, { signInMethod: 'PASSWORD' });
    const passkeySession = await signIn(app);
    const spare = await createPasskeyRow(passwordSession.userId);

    const removed = await passwordSession.inject({ method: 'DELETE', url: `${URL}/passkeys/${spare.credentialId}` });

    const passwordAfter = await passwordSession.inject({ method: 'GET', url: '/tags' });
    const passkeyAfter = await passkeySession.inject({ method: 'GET', url: '/tags' });
    expect(removed.statusCode).toBe(204);
    expect(passwordAfter.statusCode).toBe(200);
    expect(passkeyAfter.statusCode).toBe(200);
  });
});

describe('POST /auth/passkeys/options', () => {
  it('returns options for the signed-in user when a member adds a passkey', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const options = await member.inject({ method: 'POST', url: `${URL}/passkeys/options` });

    expect(options.statusCode).toBe(200);
    expect(options.json()).toMatchObject({ user: { name: 'Member' } });
  });

  it('returns 403 REAUTH_REQUIRED when adding a passkey from a sign-in older than 10 minutes', async () => {
    const api = await signIn(app, { signedInAt: new Date(Date.now() - 11 * MINUTE_MS) });

    const options = await api.inject({ method: 'POST', url: `${URL}/passkeys/options` });
    const verify = await api.inject({
      method: 'POST',
      url: `${URL}/passkeys/verify`,
      payload: { name: 'Thief', response: new TestPasskey().register({ challenge: 'bWFkZS11cA' }) },
    });

    expect(options.statusCode).toBe(403);
    expect(options.json()).toMatchObject({ code: 'REAUTH_REQUIRED' });
    expect(verify.statusCode).toBe(403);
  });
});
