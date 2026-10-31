import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { signedInUserId } from '../../plugins/auth.plugin.ts';
import { getSubmissions } from './submissions.service.ts';
import { ListSubmissionsQuerySchema, SubmissionListResponseSchema } from './submissions.type.ts';

const TAGS = ['submissions'];

export const submissionsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List the funkos the signed-in user sent in, with where each stands',
        querystring: ListSubmissionsQuerySchema,
        response: { 200: SubmissionListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getSubmissions(signedInUserId(request), request.query),
  );
};
