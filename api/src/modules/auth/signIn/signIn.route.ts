import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { SignedInResponseSchema } from '../auth.schema.ts';
import {
  OWN_ACCOUNT_CONFIG,
  PASSWORD_RATE_LIMIT,
  PUBLIC_CEREMONY_CONFIG,
  TAGS,
  requireSession,
  setSessionCookie,
} from '../auth.routeOptions.ts';
import {
  AuthenticationOptionsResponseSchema,
  ConfirmPasswordSchema,
  PasswordSignInSchema,
  SignInVerifySchema,
} from './signIn.schema.ts';
import { addPasswordSession, addRecentSignIn, addSession, getSignInOptions } from './signIn.service.ts';

export const signInRoutes: FastifyPluginAsyncZod = async (app) => {
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
};
