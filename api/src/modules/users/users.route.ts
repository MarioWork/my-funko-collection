// Every users job's routes, under /users: listing and creating users, and managing one.
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { basicsRoutes } from './basics/basics.route.ts';
import { manageRoutes } from './manage/manage.route.ts';

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(basicsRoutes);
  await app.register(manageRoutes);
};
