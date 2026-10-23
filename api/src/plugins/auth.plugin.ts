import cookie from '@fastify/cookie';
import type { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.ts';
import { ForbiddenError, UnauthorizedError } from '../lib/httpErrors.ts';
import { SESSION_COOKIE_NAME } from '../lib/sessionCookie.ts';
import { getSession, type AuthSession } from '../modules/auth/auth.service.ts';

declare module 'fastify' {
  interface FastifyContextConfig {
    // Opt a route out of the sign-in check. Everything else, the image files included, needs a session.
    isPublic?: boolean;
  }

  interface FastifyRequest {
    session: AuthSession | null;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// `none` is a request the person started themselves (typed URL, bookmark), never one another site made.
const TRUSTED_FETCH_SITES = new Set(['same-origin', 'none']);
const DOCS_PATH = '/docs';
const APP_ORIGIN = new URL(env.APP_ORIGIN).origin;

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

  app.addHook('onRequest', async (request) => {
    if (isCrossSiteWrite(request)) {
      throw new ForbiddenError('Requests from other sites are not allowed', 'CROSS_SITE_REQUEST');
    }

    request.session = await readSession(request);

    const isPublic = request.routeOptions.config.isPublic === true || isDocsRoute(request);

    if (!isPublic && !request.session) throw new UnauthorizedError('Sign in to continue');
  });

  // API answers hold the collection: no browser or proxy cache keeps them. Image files set their own header.
  app.addHook('onSend', async (_request, reply, payload) => {
    if (!reply.hasHeader('cache-control')) reply.header('cache-control', 'no-store');

    return payload;
  });
});
