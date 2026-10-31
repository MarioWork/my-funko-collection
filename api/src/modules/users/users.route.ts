import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { signedInSession } from '../../plugins/auth.plugin.ts';
import {
  CreateUserSchema,
  CreatedUserResponseSchema,
  ListUsersQuerySchema,
  UserListResponseSchema,
} from './users.schema.ts';
import { addUser, getUsers } from './users.service.ts';

const TAGS = ['users'];

// Only an admin manages users (docs/adr/0002-passwords-next-to-passkeys.md).
const ADMIN_ONLY_CONFIG = { isAdminOnly: true };

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      config: ADMIN_ONLY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'List the users with their role and how they can sign in',
        querystring: ListUsersQuerySchema,
        response: { 200: UserListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getUsers(request.query),
  );

  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      config: ADMIN_ONLY_CONFIG,
      schema: {
        tags: TAGS,
        summary: 'Create a user with a temporary password, shown only in this answer (needs a recent sign-in)',
        body: CreateUserSchema,
        response: { 201: CreatedUserResponseSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const created = await addUser(signedInSession(request), request.body);

      return reply.code(201).send(created);
    },
  );
};
