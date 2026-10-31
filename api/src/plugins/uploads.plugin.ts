import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fp from 'fastify-plugin';
import { env } from '../config/env.ts';
import { UPLOADS_ROOT, UPLOADS_URL_PREFIX, initImageStorage } from '../lib/imageStorage.ts';

// Image files are named by uuid and never rewritten, so a browser may keep them for a year; `private` keeps them
// out of shared caches, since they are only served to a signed-in browser.
const STATIC_CACHE_CONTROL = 'private, max-age=31536000, immutable';

// Owns the two HTTP ends of image storage: parsing multipart uploads in, serving the files out.
export const uploadsPlugin = fp(async (app) => {
  await initImageStorage();

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
