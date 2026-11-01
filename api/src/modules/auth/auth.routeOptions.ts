// What the auth jobs' routes share: their rate limits and access configs, the session cookie, and the session a
// signed-in route runs with.
import type { FastifyReply } from 'fastify';
import { InternalError } from '../../lib/errors.ts';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE_SECONDS } from '../../lib/sessionCookie.ts';
import type { AuthSession } from './auth.type.ts';

export const TAGS = ['auth'];

// Each passkey attempt is two requests (options, then verify): ten a minute is five attempts per device.
export const CEREMONY_RATE_LIMIT = { max: 10, timeWindow: '1 minute' };
export const PUBLIC_CEREMONY_CONFIG = { isPublic: true, rateLimit: CEREMONY_RATE_LIMIT };
// Password tries per address: enough for a few typos, far too few to guess a 15-character password. No lockout.
export const PASSWORD_RATE_LIMIT = { max: 5, timeWindow: '1 minute' };
// Replacing a temporary password and signing out stay open to a session that signed in with one, and to a
// read-only user.
export const OWN_ACCOUNT_CONFIG = { isAllowedWithTemporaryPassword: true, isAllowedWhenReadOnly: true };

// Signing out also drops what this browser cached from the app (the images are cached privately). Not "cookies":
// that would clear every cookie of the whole registrable domain (other home apps), not just this host's.
const CLEAR_SITE_DATA = '"cache"';

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE_SECONDS });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  reply.header('clear-site-data', CLEAR_SITE_DATA);
}

// The auth hook already refused requests with no session on these routes; this only narrows the type.
export function requireSession(session: AuthSession | null): AuthSession {
  if (!session) throw new InternalError('A signed-in route ran without a session');

  return session;
}
