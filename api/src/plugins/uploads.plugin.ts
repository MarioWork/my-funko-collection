import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fp from 'fastify-plugin';
import { env } from '../config/env.ts';
import { UPLOADS_ROOT, UPLOADS_URL_PREFIX, initImageStorage } from '../lib/imageStorage.ts';

// Variant files are named by uuid and never rewritten, so a browser may keep them for a year.
const STATIC_MAX_AGE = '365d';

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
    immutable: true,
    maxAge: STATIC_MAX_AGE,
    etag: true,
    acceptRanges: false,
    // Nothing else needs reply.sendFile; keeping it off avoids a decorator clash if a second static root ever appears.
    decorateReply: false,
  });
});
