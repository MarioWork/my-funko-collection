import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from '@fastify/type-provider-zod';
import Fastify, { LogController } from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.ts';
import { errorHandler, notFoundHandler } from './lib/errorHandler.ts';
import { logger } from './lib/logger.ts';
import { openApiTransformObject } from './lib/openApi.ts';
import { authRoutes } from './modules/auth/auth.route.ts';
import { healthRoutes } from './modules/health/health.route.ts';
import { statsRoutes } from './modules/stats/stats.route.ts';
import { suggestRoutes } from './modules/suggest/suggest.route.ts';
import { categoriesRoutes } from './modules/categories/categories.route.ts';
import { collectionsRoutes } from './modules/collections/collections.route.ts';
import { allItemsRoutes } from './modules/collections/items/collectionItems.route.ts';
import { exportRoutes } from './modules/export/export.route.ts';
import { funkosRoutes } from './modules/funkos/funkos.route.ts';
import { imagesRoutes } from './modules/images/images.route.ts';
import { seriesRoutes } from './modules/series/series.route.ts';
import { tagsRoutes } from './modules/tags/tags.route.ts';
import { usersRoutes } from './modules/users/users.route.ts';
import { authPlugin } from './plugins/auth.plugin.ts';
import { prismaPlugin } from './plugins/prisma.plugin.ts';
import { uploadsPlugin } from './plugins/uploads.plugin.ts';

const BODY_LIMIT_BYTES = 1_048_576;
const RATE_LIMIT_MAX = 600;
const RATE_LIMIT_WINDOW = '1 minute';
const DOCS_ROUTE_PREFIX = '/docs';
const REQUEST_LOG_MESSAGE = 'request';
// A request no route matched (a 404) has no pattern to log.
const UNMATCHED_ROUTE = '(no route)';

// Builds the configured instance and never listens: tests call it and use app.inject(); server.ts listens.
export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
    bodyLimit: BODY_LIMIT_BYTES,
    // Fastify's own two lines per request (incoming + completed) are replaced by one, in the onResponse hook below.
    logController: new LogController({ disableRequestLogging: true }),
    // Trust the nearest TRUST_PROXY_HOPS proxies. A function, because Fastify's types omit the hop-count form.
    trustProxy: (_address: string, hop: number) => hop < env.TRUST_PROXY_HOPS,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // One line per request, as fields: the route's pattern (/funkos/:funkoId), never the URL, whose query string
  // holds search text; never headers or bodies. pino-pretty shows it as "GET /funkos/:funkoId → 200 (4 ms)".
  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url ?? UNMATCHED_ROUTE;
    const durationMs = Math.round(reply.elapsedTime);

    request.log.info({ method: request.method, route, statusCode: reply.statusCode, durationMs }, REQUEST_LOG_MESSAGE);
  });

  // Infrastructure in a fixed order: sensible → cors → helmet → rate-limit → swagger → db → auth → uploads → routes.
  // Auth comes before uploads and every route module, so its sign-in check covers the image files too.
  await app.register(sensible);
  const hasCorsOrigins = env.CORS_ORIGINS.length > 0;
  if (hasCorsOrigins) {
    await app.register(cors, { origin: env.CORS_ORIGINS });
  }
  await app.register(helmet);
  await app.register(rateLimit, { max: RATE_LIMIT_MAX, timeWindow: RATE_LIMIT_WINDOW });
  await app.register(swagger, {
    openapi: { info: { title: 'My Funko Collection API', version: '1.0.0' } },
    // `transform` converts each route's zod schemas; `transformObject` lifts every schema with `.meta({ id })` into
    // components/schemas so the document has one `Funko`, one `ErrorResponse`, and so on.
    transform: jsonSchemaTransform,
    transformObject: openApiTransformObject,
  });
  if (env.NODE_ENV !== 'production') {
    await app.register(swaggerUi, { routePrefix: DOCS_ROUTE_PREFIX });
  }
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(uploadsPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(categoriesRoutes, { prefix: '/categories' });
  await app.register(seriesRoutes, { prefix: '/series' });
  await app.register(funkosRoutes, { prefix: '/funkos' });
  await app.register(collectionsRoutes, { prefix: '/collections' });
  await app.register(allItemsRoutes, { prefix: '/items' });
  await app.register(tagsRoutes, { prefix: '/tags' });
  await app.register(imagesRoutes, { prefix: '/images' });
  await app.register(suggestRoutes, { prefix: '/suggest' });
  await app.register(statsRoutes, { prefix: '/stats' });
  await app.register(exportRoutes, { prefix: '/export' });
  await app.register(usersRoutes, { prefix: '/users' });

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
