import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { signedInUserId } from '../../../plugins/auth.plugin.ts';
import {
  CollectionItemListResponseSchema,
  CollectionItemParamsSchema,
  CollectionItemsParamsSchema,
  CollectionItemResponseSchema,
  CreateCollectionItemSchema,
  ListAllItemsQuerySchema,
  ListCollectionItemsQuerySchema,
  MoveCollectionItemSchema,
  UpdateCollectionItemSchema,
} from './collectionItems.schema.ts';
import {
  addCollectionItem,
  deleteCollectionItem,
  getAllItems,
  getCollectionItem,
  getCollectionItems,
  moveCollectionItem,
  updateCollectionItem,
} from './collectionItems.service.ts';

const TAGS = ['collection items'];

// Mounted under /collections/:collectionId/items.
export const collectionItemsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List the items of a collection',
        params: CollectionItemsParamsSchema,
        querystring: ListCollectionItemsQuerySchema,
        response: { 200: CollectionItemListResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getCollectionItems(signedInUserId(request), request.params.collectionId, request.query),
  );

  app.get(
    '/:itemId',
    {
      schema: {
        tags: TAGS,
        summary: 'Get an item',
        params: CollectionItemParamsSchema,
        response: { 200: CollectionItemResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getCollectionItem(signedInUserId(request), request.params.collectionId, request.params.itemId),
  );

  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'Add a funko to a collection (409 with existingId when it is already there)',
        params: CollectionItemsParamsSchema,
        body: CreateCollectionItemSchema,
        response: {
          201: CollectionItemResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const item = await addCollectionItem(signedInUserId(request), request.params.collectionId, request.body);

      return reply.code(201).send(item);
    },
  );

  app.patch(
    '/:itemId',
    {
      schema: {
        tags: TAGS,
        summary: 'Update an item (tagIds replaces the whole set)',
        params: CollectionItemParamsSchema,
        body: UpdateCollectionItemSchema,
        response: { 200: CollectionItemResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) =>
      updateCollectionItem(signedInUserId(request), request.params.collectionId, request.params.itemId, request.body),
  );

  app.post(
    '/:itemId/move',
    {
      schema: {
        tags: TAGS,
        summary: 'Move an item to another collection, keeping tags, notes and purchase data',
        params: CollectionItemParamsSchema,
        body: MoveCollectionItemSchema,
        response: {
          200: CollectionItemResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) =>
      moveCollectionItem(signedInUserId(request), request.params.collectionId, request.params.itemId, request.body),
  );

  app.delete(
    '/:itemId',
    {
      schema: {
        tags: TAGS,
        summary: 'Remove an item from a collection',
        params: CollectionItemParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteCollectionItem(signedInUserId(request), request.params.collectionId, request.params.itemId);

      return reply.code(204).send();
    },
  );
};

// Mounted under /items: the same list across every collection.
export const allItemsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List items across all collections',
        querystring: ListAllItemsQuerySchema,
        response: { 200: CollectionItemListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getAllItems(signedInUserId(request), request.query),
  );
};
