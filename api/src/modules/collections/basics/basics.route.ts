import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { signedInUserId } from '../../../plugins/auth.plugin.ts';
import {
  CollectionListResponseSchema,
  CollectionParamsSchema,
  CollectionResponseSchema,
  CreateCollectionSchema,
  ListCollectionsQuerySchema,
  UpdateCollectionSchema,
} from './basics.schema.ts';
import { addCollection, deleteCollection, getCollection, getCollections, updateCollection } from './basics.service.ts';

const TAGS = ['collections'];

export const basicsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List collections',
        querystring: ListCollectionsQuerySchema,
        response: { 200: CollectionListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getCollections(signedInUserId(request), request.query),
  );

  app.get(
    '/:collectionId',
    {
      schema: {
        tags: TAGS,
        summary: 'Get a collection',
        params: CollectionParamsSchema,
        response: { 200: CollectionResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getCollection(signedInUserId(request), request.params.collectionId),
  );

  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'Create a collection',
        body: CreateCollectionSchema,
        response: { 201: CollectionResponseSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const collection = await addCollection(signedInUserId(request), request.body);

      return reply.code(201).send(collection);
    },
  );

  app.patch(
    '/:collectionId',
    {
      schema: {
        tags: TAGS,
        summary: 'Update a collection (isDefault: true moves the default here)',
        params: CollectionParamsSchema,
        body: UpdateCollectionSchema,
        response: {
          200: CollectionResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => updateCollection(signedInUserId(request), request.params.collectionId, request.body),
  );

  app.delete(
    '/:collectionId',
    {
      schema: {
        tags: TAGS,
        summary: 'Delete a collection and its items (409 for the default one)',
        params: CollectionParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteCollection(signedInUserId(request), request.params.collectionId);

      return reply.code(204).send();
    },
  );
};
