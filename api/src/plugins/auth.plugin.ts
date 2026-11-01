import cookie from '@fastify/cookie';
import type { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.ts';
import { ErrorResponseSchema } from '../lib/errorHandler.ts';
import { InternalError } from '../lib/errors.ts';
import { ForbiddenError, UnauthorizedError } from '../lib/httpErrors.ts';
import { SESSION_COOKIE_NAME } from '../lib/sessionCookie.ts';
import { getSession } from '../modules/auth/session/session.service.ts';
import type { AuthSession, SignedInUser } from '../modules/auth/auth.type.ts';

declare module 'fastify' {
  interface FastifyContextConfig {
    // Opt a route out of the sign-in check. Everything else, the image files included, needs a session.
    isPublic?: boolean;
    // Only an admin may call it: changing or deleting a category or series, reviewing submissions, the images lists
    // and the users. A member gets 403 ADMIN_ONLY. Creating a funko, category or series, changing a funko or its
    // images, and sending a rejected one again, are open to members: their services make a member's new one a
    // waiting submission and refuse (with the same 403) any change but to the member's own waiting or rejected one.
    isAdminOnly?: boolean;
    // Still open to a session signed in with a temporary password: replacing it, and signing out. Every other
    // locked route answers 403 PASSWORD_CHANGE_REQUIRED until the user has chosen their own password.
    isAllowedWithTemporaryPassword?: boolean;
    // A write still open to a read-only user: their own password and passkeys, and signing out. Every other write
    // (any method but GET, HEAD and OPTIONS) answers 403 READ_ONLY to them; reads stay open.
    isAllowedWhenReadOnly?: boolean;
  }

  interface FastifyRequest {
    session: AuthSession | null;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// `none` is a request the person started themselves (typed URL, bookmark), never one another site made.
const TRUSTED_FETCH_SITES = new Set(['same-origin', 'none']);
const DOCS_PATH = '/docs';
const UNAUTHORIZED_STATUS = 401;
const FORBIDDEN_STATUS = 403;
const APP_ORIGIN = new URL(env.APP_ORIGIN).origin;
const ADMIN_ONLY_MESSAGE = 'Only an admin can do this';
const PASSWORD_CHANGE_MESSAGE = 'Choose your own password first';
const READ_ONLY_MESSAGE = 'This account is read-only';

// The OpenAPI page is only registered outside production and reads no data of its own. Matched on the route's
// registered pattern (not the raw URL), and only /docs itself or below it: a future /documents stays locked.
function isDocsRoute(request: FastifyRequest): boolean {
  const routeUrl = request.routeOptions.url ?? '';
  const isDocsPath = routeUrl === DOCS_PATH || routeUrl.startsWith(`${DOCS_PATH}/`);

  return env.NODE_ENV !== 'production' && isDocsPath;
}

// Cross-site write protection (OWASP CSRF cheat sheet, Fetch Metadata): a browser always says where a request
// came from, in Sec-Fetch-Site or at least Origin. A write from another site is refused before anything runs.
// A request with neither header is not from a browser (curl, tests) and carries no cookie a site could abuse.
function isCrossSiteWrite(request: FastifyRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return false;

  const fetchSite = request.headers['sec-fetch-site'];

  if (fetchSite) return !TRUSTED_FETCH_SITES.has(fetchSite);

  const origin = request.headers.origin;

  if (origin) return origin !== APP_ORIGIN;

  return false;
}

// The session of a locked route. The hook below already refused a request with no session; this only narrows the
// type, so a route that reaches it without one is a bug.
export function signedInSession(request: FastifyRequest): AuthSession {
  if (!request.session) throw new InternalError('A signed-in route ran without a session');

  return request.session;
}

// Whose collections a locked route works on.
export function signedInUserId(request: FastifyRequest): number {
  return signedInSession(request).userId;
}

// Who calls a locked route and whether they are an admin: what a service needs to decide what they may change.
export function signedInUser(request: FastifyRequest): SignedInUser {
  const session = signedInSession(request);

  return { userId: session.userId, isAdmin: session.userRole === 'ADMIN' };
}

async function readSession(request: FastifyRequest): Promise<AuthSession | null> {
  const token = request.cookies[SESSION_COOKIE_NAME];

  if (!token) return null;

  return getSession(token);
}

// Locked by default: a route is open only when it says `config: { isPublic: true }`. A route someone forgets to
// mark stays locked, never open. Registered before the uploads plugin and every route module.
export const authPlugin = fp(async (app) => {
  await app.register(cookie);

  app.decorateRequest('session', null);

  // Every route documents what this plugin can answer for it, so the OpenAPI shows the envelope: 401 on a locked
  // route, 403 on any write (a cross-site write) and on an admin-only route. Added here once instead of on each.
  app.addHook('onRoute', (route) => {
    const response = route.schema?.response as Record<number, unknown> | undefined;

    if (!response) return;

    const methods = Array.isArray(route.method) ? route.method : [route.method];
    const isWrite = methods.some((method) => !SAFE_METHODS.has(method));

    const isPublic = route.config?.isPublic === true;

    if (!isPublic) response[UNAUTHORIZED_STATUS] ??= ErrorResponseSchema;

    // Every locked route can answer PASSWORD_CHANGE_REQUIRED to a temporary-password session.
    if (isWrite || !isPublic) response[FORBIDDEN_STATUS] ??= ErrorResponseSchema;
  });

  app.addHook('onRequest', async (request) => {
    if (isCrossSiteWrite(request)) {
      throw new ForbiddenError('Requests from other sites are not allowed', 'CROSS_SITE_REQUEST');
    }

    request.session = await readSession(request);

    const isPublic = request.routeOptions.config.isPublic === true || isDocsRoute(request);

    if (!isPublic && !request.session) throw new UnauthorizedError('Sign in to continue');

    const isAllowedWithTemporaryPassword =
      isPublic || request.routeOptions.config.isAllowedWithTemporaryPassword === true;

    if (request.session?.mustChangePassword && !isAllowedWithTemporaryPassword) {
      throw new ForbiddenError(PASSWORD_CHANGE_MESSAGE, 'PASSWORD_CHANGE_REQUIRED');
    }

    // Before the admin gate, so a read-only user hears why for every write, admin-only ones included.
    const isLockedWrite = !SAFE_METHODS.has(request.method) && !isPublic;
    const isAllowedWhenReadOnly = request.routeOptions.config.isAllowedWhenReadOnly === true;

    if (request.session?.isReadOnly && isLockedWrite && !isAllowedWhenReadOnly) {
      throw new ForbiddenError(READ_ONLY_MESSAGE, 'READ_ONLY');
    }

    const isAdminOnly = request.routeOptions.config.isAdminOnly === true;
    const isAdmin = request.session?.userRole === 'ADMIN';

    if (isAdminOnly && !isAdmin) throw new ForbiddenError(ADMIN_ONLY_MESSAGE, 'ADMIN_ONLY');
  });

  // API answers hold the collection: no browser or proxy cache keeps them. Image files set their own header.
  app.addHook('onSend', async (_request, reply, payload) => {
    if (!reply.hasHeader('cache-control')) reply.header('cache-control', 'no-store');

    return payload;
  });
});
