import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { signedInUser, signedInUserId } from '../../plugins/auth.plugin.ts';
import {
  BarcodeParamsSchema,
  CreateFunkoSchema,
  DeleteFunkoQuerySchema,
  FunkoDetailResponseSchema,
  FunkoListResponseSchema,
  FunkoParamsSchema,
  FunkoResponseSchema,
  ListFunkosQuerySchema,
  UpdateFunkoSchema,
} from './funkos.schema.ts';
import { addFunko, deleteFunko, getFunko, getFunkoByBarcode, getFunkos, updateFunko } from './funkos.service.ts';
import { funkoImagesRoutes } from './images/funkoImages.route.ts';

const TAGS = ['funkos'];
const IMAGES_PREFIX = '/:funkoId/images';

export const funkosRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List and search funkos (q searches every field; named params narrow one field)',
        querystring: ListFunkosQuerySchema,
        response: { 200: FunkoListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getFunkos(signedInUserId(request), request.query),
  );

  app.get(
    '/by-barcode/:barcode',
    {
      schema: {
        tags: TAGS,
        summary: 'Find a funko by the barcode on its box',
        params: BarcodeParamsSchema,
        response: { 200: FunkoResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getFunkoByBarcode(signedInUserId(request), request.params.barcode),
  );

  app.get(
    '/:funkoId',
    {
      schema: {
        tags: TAGS,
        summary: 'Get a funko with all its images',
        params: FunkoParamsSchema,
        response: { 200: FunkoDetailResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getFunko(signedInUser(request), request.params.funkoId),
  );

  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: "Create a funko (a member's is a waiting submission; 409 with existingId when it already exists)",
        body: CreateFunkoSchema,
        response: { 201: FunkoResponseSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const funko = await addFunko(signedInUser(request), request.body);

      return reply.code(201).send(funko);
    },
  );

  app.patch(
    '/:funkoId',
    {
      schema: {
        tags: TAGS,
        summary: 'Update a funko (a member: only their own waiting submission)',
        params: FunkoParamsSchema,
        body: UpdateFunkoSchema,
        response: {
          200: FunkoResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => updateFunko(signedInUser(request), request.params.funkoId, request.body),
  );

  app.delete(
    '/:funkoId',
    {
      schema: {
        tags: TAGS,
        summary:
          'Delete a funko and its images (409 while it sits in a collection, unless force=true; a member: only their own waiting submission)',
        params: FunkoParamsSchema,
        querystring: DeleteFunkoQuerySchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteFunko(signedInUser(request), request.params.funkoId, request.query);

      return reply.code(204).send();
    },
  );

  await app.register(funkoImagesRoutes, { prefix: IMAGES_PREFIX });
};
