// Every submissions job's routes, under /submissions: a member's own list, the admins' review, sending a rejected one
// in again, and merging.
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { mergeRoutes } from './merge/merge.route.ts';
import { resubmissionRoutes } from './resubmission/resubmission.route.ts';
import { reviewRoutes } from './review/review.route.ts';
import { sentRoutes } from './sent/sent.route.ts';

export const submissionsRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(sentRoutes);
  await app.register(reviewRoutes);
  await app.register(mergeRoutes);
  await app.register(resubmissionRoutes);
};
