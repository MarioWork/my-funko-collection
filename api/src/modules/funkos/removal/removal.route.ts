import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { signedInUser } from '../../../plugins/auth.plugin.ts';
import { FunkoParamsSchema } from '../funkos.schema.ts';
import { DeleteFunkoQuerySchema, DeleteFunkoSchema } from './removal.schema.ts';
import { deleteFunko } from './removal.service.ts';

const TAGS = ['funkos'];

export const removalRoutes: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/:funkoId',
    {
      schema: {
        tags: TAGS,
        summary:
          'Delete a funko and its images (409 with userCount while it sits in a collection, unless force=true; a reason in the body when other users have it, sent to them; a member: only their own submission)',
        params: FunkoParamsSchema,
        querystring: DeleteFunkoQuerySchema,
        // A DELETE without a body reaches the validator as null.
        body: DeleteFunkoSchema.nullable(),
        response: {
          204: z.undefined(),
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await deleteFunko(signedInUser(request), request.params.funkoId, request.query, request.body);

      return reply.code(204).send();
    },
  );
};
