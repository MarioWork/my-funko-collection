// Every collections job's routes, under /collections: the user's collections and the items in each. The same items
// across every collection are under /items (allItemsRoutes in items/items.route.ts, registered in app.ts).
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { basicsRoutes } from './basics/basics.route.ts';
import { collectionItemsRoutes } from './items/items.route.ts';

const ITEMS_PREFIX = '/:collectionId/items';

export const collectionsRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(basicsRoutes);
  await app.register(collectionItemsRoutes, { prefix: ITEMS_PREFIX });
};
