import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { InternalError } from '../../lib/errors.ts';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE_SECONDS } from '../../lib/sessionCookie.ts';
import {
  AddPasskeyVerifySchema,
  AuthStatusResponseSchema,
  AuthenticationOptionsResponseSchema,
  ConfirmPasswordSchema,
  PasskeyListResponseSchema,
  PasskeyParamsSchema,
  PasskeyResponseSchema,
  PasswordSignInSchema,
  RegistrationOptionsResponseSchema,
  SetPasswordSchema,
  SetupOptionsSchema,
  SetupVerifySchema,
  SignInVerifySchema,
  SignedInResponseSchema,
} from './auth.schema.ts';
import {
  addFirstUser,
  addPasskey,
  deleteAllSessions,
  deletePasskey,
  deleteSession,
  getAddPasskeyOptions,
  getAuthStatus,
  getPasskeys,
  getSetupOptions,
  getSignInOptions,
  addSession,
  addPasswordSession,
  addRecentSignIn,
  setPassword,
  type AuthSession,
} from './auth.service.ts';

const TAGS = ['auth'];

// Each passkey attempt is two requests (options, then verify): ten a minute is five attempts per device.
const CEREMONY_RATE_LIMIT = { max: 10, timeWindow: '1 minute' };
const PUBLIC_CEREMONY_CONFIG = { isPublic: true, rateLimit: CEREMONY_RATE_LIMIT };
// Password tries per address: enough for a few typos, far too few to guess a 15-character password. No lockout.
const PASSWORD_RATE_LIMIT = { max: 5, timeWindow: '1 minute' };
// Replacing a temporary password and signing out stay open to a session that signed in with one, and to a
// read-only user.
const OWN_ACCOUNT_CONFIG = { isAllowedWithTemporaryPassword: true, isAllowedWhenReadOnly: true };
// A read-only user still looks after their own passkeys.
const OWN_PASSKEY_CONFIG = { rateLimit: CEREMONY_RATE_LIMIT, isAllowedWhenReadOnly: true };

// Signing out also drops what this browser cached from the app (the images are cached privately). Not "cookies":
// that would clear every cookie of the whole registrable domain (other home apps), not just this host's.
const CLEAR_SITE_DATA = '"cache"';

function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE_SECONDS });
}

function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  reply.header('clear-site-data', CLEAR_SITE_DATA);
}

// The auth hook already refused requests with no session on these routes; this only narrows the type.
function requireSession(session: AuthSession | null): AuthSession {
  if (!session) throw new InternalError('A signed-in route ran without a session');

  return session;
}

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/status',
    {
      config: { isPublic: true },
      schema: {
        tags: TAGS,
        summary: 'Whether the app needs setting up, and whether this browser is signed in',
        response: { 200: AuthStatusResponseSchema },
      },
    },
    async (request) => getAuthStatus(request.session),
  );

  app.post(
    '/setup/options',
    {
      config: PUBLIC_CEREMONY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'First run: start making the first passkey (needs the setup code from the server log)',
        body: SetupOptionsSchema,
        response: {
          403: ErrorResponseSchema,
          200: RegistrationOptionsResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request) => getSetupOptions(request.body),
  );

  app.post(
    '/setup/verify',
    {
      config: PUBLIC_CEREMONY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'First run: save the first passkey and sign in',
        body: SetupVerifySchema,
        response: {
          403: ErrorResponseSchema,
          200: SignedInResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { token, result } = await addFirstUser(request.body);
      setSessionCookie(reply, token);

      return result;
    },
  );

  app.post(
    '/login/options',
    {
      config: PUBLIC_CEREMONY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Start signing in with a passkey',
        response: {
          403: ErrorResponseSchema,
          200: AuthenticationOptionsResponseSchema,
          409: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async () => getSignInOptions(),
  );

  app.post(
    '/login/verify',
    {
      config: PUBLIC_CEREMONY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Finish signing in: a new session replaces any old one in this browser',
        body: SignInVerifySchema,
        response: {
          403: ErrorResponseSchema,
          200: SignedInResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { token, result } = await addSession(request.body, request.session);
      setSessionCookie(reply, token);

      return result;
    },
  );

  app.post(
    '/login/password',
    {
      config: { isPublic: true, rateLimit: PASSWORD_RATE_LIMIT },
      schema: {
        tags: TAGS,
        summary: 'Sign in with a username and password: a new session replaces any old one in this browser',
        body: PasswordSignInSchema,
        response: {
          403: ErrorResponseSchema,
          200: SignedInResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { token, result } = await addPasswordSession(request.body, request.session);
      setSessionCookie(reply, token);

      return result;
    },
  );

  // "Confirm it's you" with the signed-in user's password, next to a passkey sign-in (/login/verify). Open to a
  // temporary-password session and a read-only user too: replacing their password or changing their passkeys
  // more than 10 minutes after signing in needs it.
  // The sign-in's limit, counted on its own (rate-limit keeps one count per route); it needs a session anyway.
  app.post(
    '/recent-sign-in',
    {
      config: { rateLimit: PASSWORD_RATE_LIMIT, ...OWN_ACCOUNT_CONFIG },
      schema: {
        tags: TAGS,
        summary: "Confirm it's you with your password: a fresh session replaces this one (renews the recent sign-in)",
        body: ConfirmPasswordSchema,
        response: {
          200: SignedInResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { token, result } = await addRecentSignIn(requireSession(request.session), request.body);
      setSessionCookie(reply, token);

      return result;
    },
  );

  // Public on purpose: an expired or unknown cookie still gets cleared, with the cached images.
  app.post(
    '/logout',
    {
      config: { isPublic: true, ...OWN_ACCOUNT_CONFIG },
      schema: {
        tags: TAGS,
        summary: 'Sign this browser out (always clears the cookie)',
        response: { 204: z.undefined(), 403: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      if (request.session) await deleteSession(request.session);
      clearSessionCookie(reply);

      return reply.code(204).send();
    },
  );

  app.post(
    '/logout-everywhere',
    {
      config: OWN_ACCOUNT_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Sign every browser out, this one included',
        response: { 403: ErrorResponseSchema, 204: z.undefined(), 401: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteAllSessions(requireSession(request.session));
      clearSessionCookie(reply);

      return reply.code(204).send();
    },
  );

  app.put(
    '/password',
    {
      config: OWN_ACCOUNT_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Set or change the username and password (needs a recent sign-in; ends other password sessions)',
        body: SetPasswordSchema,
        response: {
          200: SignedInResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => setPassword(requireSession(request.session), request.body),
  );

  app.get(
    '/passkeys',
    {
      schema: {
        tags: TAGS,
        summary: 'List the passkeys that can sign in',
        response: { 200: PasskeyListResponseSchema, 401: ErrorResponseSchema },
      },
    },
    async (request) => getPasskeys(requireSession(request.session)),
  );

  app.post(
    '/passkeys/options',
    {
      config: OWN_PASSKEY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Start adding another passkey',
        response: {
          403: ErrorResponseSchema,
          200: RegistrationOptionsResponseSchema,
          401: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request) => getAddPasskeyOptions(requireSession(request.session)),
  );

  app.post(
    '/passkeys/verify',
    {
      config: OWN_PASSKEY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Save another passkey',
        body: AddPasskeyVerifySchema,
        response: {
          403: ErrorResponseSchema,
          201: PasskeyResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema,
          429: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const passkey = await addPasskey(requireSession(request.session), request.body);

      return reply.code(201).send(passkey);
    },
  );

  app.delete(
    '/passkeys/:passkeyId',
    {
      config: { isAllowedWhenReadOnly: true },
      schema: {
        tags: TAGS,
        summary: 'Remove a passkey (needs a recent sign-in; never the last one)',
        params: PasskeyParamsSchema,
        response: {
          204: z.undefined(),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await deletePasskey(requireSession(request.session), request.params.passkeyId);

      return reply.code(204).send();
    },
  );
};
