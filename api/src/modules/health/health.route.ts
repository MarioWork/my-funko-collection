import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { getLiveness, getReadiness } from './health.service.ts';

const TAGS = ['health'];

const HealthResponseSchema = z.object({ status: z.literal('ok') });

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
