import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { SuggestQuerySchema, SuggestResponseSchema } from './suggest.schema.ts';
import { getSuggestions } from './suggest.service.ts';

const TAGS = ['suggest'];

export const suggestRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'Search-bar suggestions: funkos, categories, collections and tags at once',
        querystring: SuggestQuerySchema,
        response: { 200: SuggestResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getSuggestions(request.query),
  );
};
