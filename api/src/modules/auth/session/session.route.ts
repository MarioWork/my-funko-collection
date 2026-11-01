import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { OWN_ACCOUNT_CONFIG, TAGS, clearSessionCookie, requireSession } from '../auth.routeOptions.ts';
import { AuthStatusResponseSchema } from './session.schema.ts';
import { deleteAllSessions, deleteSession, getAuthStatus } from './session.service.ts';

export const sessionRoutes: FastifyPluginAsyncZod = async (app) => {
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
};
