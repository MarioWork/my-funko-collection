import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { RegistrationOptionsResponseSchema, SignedInResponseSchema } from '../auth.schema.ts';
import { PUBLIC_CEREMONY_CONFIG, TAGS, setSessionCookie } from '../auth.routeOptions.ts';
import { SetupOptionsSchema, SetupVerifySchema } from './setup.schema.ts';
import { addFirstUser, getSetupOptions } from './setup.service.ts';

export const setupRoutes: FastifyPluginAsyncZod = async (app) => {
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
};
