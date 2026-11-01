import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { SignedInResponseSchema } from '../auth.schema.ts';
import { OWN_ACCOUNT_CONFIG, TAGS, requireSession } from '../auth.routeOptions.ts';
import { SetPasswordSchema } from './password.schema.ts';
import { setPassword } from './password.service.ts';

export const passwordRoutes: FastifyPluginAsyncZod = async (app) => {
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
};
