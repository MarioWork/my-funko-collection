import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { StatsResponseSchema } from './stats.schema.ts';
import { getStats } from './stats.service.ts';

const TAGS = ['stats'];

export const statsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: { tags: TAGS, summary: 'Totals for the home page', response: { 200: StatsResponseSchema } },
    },
    async () => getStats(),
  );
};
