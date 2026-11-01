import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import type { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.ts';
import { UPLOADS_ROOT, UPLOADS_URL_PREFIX, funkoIdOfUploadPath, initImageStorage } from '../lib/imageStorage.ts';
import { assertCanSeeImageFiles } from '../modules/funkos/images/images.service.ts';
import { signedInUser } from './auth.plugin.ts';

// Image files are named by uuid and never rewritten, so a browser may keep them for a year; `private` keeps them
// out of shared caches, since they are only served to a signed-in browser.
const STATIC_CACHE_CONTROL = 'private, max-age=31536000, immutable';
const UPLOADS_ROUTE = `${UPLOADS_URL_PREFIX}/*`;

function isUploadsRoute(request: FastifyRequest): boolean {
  return request.routeOptions.url === UPLOADS_ROUTE;
}

// Owns the two HTTP ends of image storage: parsing multipart uploads in, serving the files out.
export const uploadsPlugin = fp(async (app) => {
  await initImageStorage();

  // After the sign-in check (the auth plugin's hook runs first): a submission's photos are only for admins and its
  // sender until it is approved; anyone else gets 404, as if the file were not there.
  app.addHook('onRequest', async (request) => {
    if (!isUploadsRoute(request)) return;

    await assertCanSeeImageFiles(signedInUser(request), funkoIdOfUploadPath(request.url));
  });

  await app.register(multipart, {
    limits: { fileSize: env.MAX_IMAGE_BYTES, files: env.MAX_IMAGES_PER_FUNKO },
  });

  await app.register(fastifyStatic, {
    root: UPLOADS_ROOT,
    prefix: `${UPLOADS_URL_PREFIX}/`,
    index: false,
    cacheControl: false,
    setHeaders: (reply) => {
      reply.header('cache-control', STATIC_CACHE_CONTROL);
    },
    etag: true,
    acceptRanges: false,
    // Nothing else needs reply.sendFile; keeping it off avoids a decorator clash if a second static root ever appears.
    decorateReply: false,
  });
});
