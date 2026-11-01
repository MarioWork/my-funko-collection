import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { RegistrationOptionsResponseSchema } from '../auth.schema.ts';
import { CEREMONY_RATE_LIMIT, TAGS, requireSession } from '../auth.routeOptions.ts';
import {
  AddPasskeyVerifySchema,
  PasskeyListResponseSchema,
  PasskeyParamsSchema,
  PasskeyResponseSchema,
} from './passkeys.schema.ts';
import { addPasskey, deletePasskey, getAddPasskeyOptions, getPasskeys } from './passkeys.service.ts';

// A read-only user still looks after their own passkeys.
const OWN_PASSKEY_CONFIG = { rateLimit: CEREMONY_RATE_LIMIT, isAllowedWhenReadOnly: true };

export const passkeysRoutes: FastifyPluginAsyncZod = async (app) => {
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
