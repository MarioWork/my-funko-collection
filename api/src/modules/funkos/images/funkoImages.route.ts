import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { signedInUser } from '../../../plugins/auth.plugin.ts';
import {
  FunkoImageListResponseSchema,
  FunkoImageParamsSchema,
  FunkoImagesParamsSchema,
  ImageFromUrlSchema,
  ReorderImagesSchema,
  RotateImageSchema,
} from './funkoImages.schema.ts';
import { FunkoImageResponseSchema } from './funkoImages.type.ts';
import { addImageFromUrl, addImages, deleteImage, reorderImages, rotateImage } from './funkoImages.service.ts';

const TAGS = ['funko images'];
const FILE_FIELD = 'file';

// Drains every file part of the multipart body into memory. Multipart's own limits bound size and count.
async function readUploadedFiles(request: FastifyRequest): Promise<Buffer[]> {
  const buffers: Buffer[] = [];

  for await (const part of request.files()) {
    const isExpectedField = part.fieldname === FILE_FIELD;
    const buffer = await part.toBuffer();

    if (isExpectedField) buffers.push(buffer);
  }

  return buffers;
}

export const funkoImagesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'Upload one or more photos (multipart, field "file")',
        consumes: ['multipart/form-data'],
        params: FunkoImagesParamsSchema,
        response: {
          201: FunkoImageListResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
          413: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const buffers = await readUploadedFiles(request);
      const images = await addImages(signedInUser(request), request.params.funkoId, buffers);

      return reply.code(201).send(images);
    },
  );

  app.post(
    '/from-url',
    {
      schema: {
        tags: TAGS,
        summary: 'Download an image from a public URL and store it',
        params: FunkoImagesParamsSchema,
        body: ImageFromUrlSchema,
        response: {
          201: FunkoImageResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
          413: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const image = await addImageFromUrl(signedInUser(request), request.params.funkoId, request.body.url);

      return reply.code(201).send(image);
    },
  );

  app.patch(
    '/order',
    {
      schema: {
        tags: TAGS,
        summary: 'Reorder the images (first is the primary)',
        params: FunkoImagesParamsSchema,
        body: ReorderImagesSchema,
        response: { 200: FunkoImageListResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => reorderImages(signedInUser(request), request.params.funkoId, request.body),
  );

  app.post(
    '/:imageId/rotate',
    {
      schema: {
        tags: TAGS,
        summary: 'Rotate an image clockwise; it gets new URLs',
        params: FunkoImageParamsSchema,
        body: RotateImageSchema,
        response: { 200: FunkoImageResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => rotateImage(signedInUser(request), request.params.funkoId, request.params.imageId, request.body),
  );

  app.delete(
    '/:imageId',
    {
      schema: {
        tags: TAGS,
        summary: 'Delete an image',
        params: FunkoImageParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteImage(signedInUser(request), request.params.funkoId, request.params.imageId);

      return reply.code(204).send();
    },
  );
};
