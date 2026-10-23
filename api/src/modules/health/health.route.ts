import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { HealthResponseSchema } from './health.schema.ts';
import { getLiveness, getReadiness } from './health.service.ts';

const TAGS = ['health'];

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      config: { isPublic: true },
      schema: { tags: TAGS, summary: 'Liveness probe', response: { 200: HealthResponseSchema } },
    },
    async () => getLiveness(),
  );

  app.get(
    '/ready',
    {
      config: { isPublic: true },
      schema: {
        tags: TAGS,
        summary: 'Readiness probe',
        response: { 200: HealthResponseSchema, 503: ErrorResponseSchema },
      },
    },
    async () => getReadiness(),
  );
};
