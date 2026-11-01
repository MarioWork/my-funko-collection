// Every funkos job's routes, under /funkos: the catalogue's funkos, deleting one, and their images.
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { basicsRoutes } from './basics/basics.route.ts';
import { funkoImagesRoutes } from './images/images.route.ts';
import { removalRoutes } from './removal/removal.route.ts';

const IMAGES_PREFIX = '/:funkoId/images';

export const funkosRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(basicsRoutes);
  await app.register(removalRoutes);
  await app.register(funkoImagesRoutes, { prefix: IMAGES_PREFIX });
};
