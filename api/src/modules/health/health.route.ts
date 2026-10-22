import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { getLiveness, isDatabaseReady } from './health.service.ts';

const TAGS = ['health'];

const HealthResponseSchema = z.object({ status: z.literal('ok') });

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    { schema: { tags: TAGS, summary: 'Liveness probe', response: { 200: HealthResponseSchema } } },
    async () => getLiveness(),
  );

  app.get(
    '/ready',
    {
      schema: {
        tags: TAGS,
        summary: 'Readiness probe',
        response: { 200: HealthResponseSchema, 503: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const isReady = await isDatabaseReady();

      if (!isReady) {
        request.log.error('readiness check failed: database not reachable');

        return reply.code(503).send({ code: 'NOT_READY', message: 'Database is not reachable' });
      }

      return getLiveness();
    },
  );
};
