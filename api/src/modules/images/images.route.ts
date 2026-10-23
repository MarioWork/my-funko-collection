import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { ImageGroupListResponseSchema, ImageListResponseSchema, ListImagesQuerySchema } from './images.schema.ts';
import { getImageGroups, getImages } from './images.service.ts';

const TAGS = ['images'];

export const imagesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List every stored image, including files no funko uses',
        querystring: ListImagesQuerySchema,
        response: { 200: ImageListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getImages(request.query),
  );

  app.get(
    '/groups',
    {
      schema: {
        tags: TAGS,
        summary: "The same images grouped by funko, with each group's count and total size (loose files last)",
        querystring: ListImagesQuerySchema,
        response: { 200: ImageGroupListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getImageGroups(request.query),
  );
};
