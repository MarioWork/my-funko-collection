import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { signedInUserId } from '../../plugins/auth.plugin.ts';
import {
  CreateTagSchema,
  ListTagsQuerySchema,
  TagListResponseSchema,
  TagParamsSchema,
  TagResponseSchema,
  UpdateTagSchema,
} from './tags.schema.ts';
import { addTag, deleteTag, getTag, getTags, updateTag } from './tags.service.ts';

const TAGS = ['tags'];

export const tagsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List tags',
        querystring: ListTagsQuerySchema,
        response: { 200: TagListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getTags(signedInUserId(request), request.query),
  );

  app.get(
    '/:tagId',
    {
      schema: {
        tags: TAGS,
        summary: 'Get a tag',
        params: TagParamsSchema,
        response: { 200: TagResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getTag(signedInUserId(request), request.params.tagId),
  );

  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'Create a tag',
        body: CreateTagSchema,
        response: { 201: TagResponseSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const tag = await addTag(signedInUserId(request), request.body);

      return reply.code(201).send(tag);
    },
  );

  app.patch(
    '/:tagId',
    {
      schema: {
        tags: TAGS,
        summary: 'Update a tag',
        params: TagParamsSchema,
        body: UpdateTagSchema,
        response: {
          200: TagResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => updateTag(signedInUserId(request), request.params.tagId, request.body),
  );

  app.delete(
    '/:tagId',
    {
      schema: {
        tags: TAGS,
        summary: 'Delete a tag (removes it from every item)',
        params: TagParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteTag(signedInUserId(request), request.params.tagId);

      return reply.code(204).send();
    },
  );
};
