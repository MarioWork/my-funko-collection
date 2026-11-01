import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { signedInSession } from '../../../plugins/auth.plugin.ts';
import { UserResponseSchema, UserWithTemporaryPasswordResponseSchema } from '../users.schema.ts';
import { NewTemporaryPasswordSchema, UpdateUserSchema, UserParamsSchema } from './manage.schema.ts';
import { addTemporaryPassword, deleteUser, updateUser } from './manage.service.ts';

const TAGS = ['users'];

// Only an admin manages users (docs/adr/0002-passwords-next-to-passkeys.md).
const ADMIN_ONLY_CONFIG = { isAdminOnly: true };

export const manageRoutes: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/:userId',
    {
      config: ADMIN_ONLY_CONFIG,
      schema: {
        tags: TAGS,
        summary:
          "Change a user's role or make them read-only (or not), and end their sessions; never the last admin (needs a recent sign-in)",
        params: UserParamsSchema,
        body: UpdateUserSchema,
        response: {
          200: UserResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => updateUser(signedInSession(request), request.params.userId, request.body),
  );

  app.post(
    '/:userId/temporary-password',
    {
      config: ADMIN_ONLY_CONFIG,
      schema: {
        tags: TAGS,
        summary:
          'Give a user a new temporary password, shown only in this answer, and end their sessions (needs a recent sign-in)',
        params: UserParamsSchema,
        body: NewTemporaryPasswordSchema,
        response: {
          200: UserWithTemporaryPasswordResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => addTemporaryPassword(signedInSession(request), request.params.userId, request.body),
  );

  app.delete(
    '/:userId',
    {
      config: ADMIN_ONLY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Delete a user with their collections, items and tags; never the last admin (needs a recent sign-in)',
        params: UserParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteUser(signedInSession(request), request.params.userId);

      return reply.code(204).send();
    },
  );
};
