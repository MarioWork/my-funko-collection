import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import {
  CategoryListResponseSchema,
  CategoryParamsSchema,
  CategoryResponseSchema,
  CreateCategorySchema,
  ListCategoriesQuerySchema,
  UpdateCategorySchema,
} from './categories.schema.ts';
import { addCategory, deleteCategory, getCategories, getCategory, updateCategory } from './categories.service.ts';

const TAGS = ['categories'];

export const categoriesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List categories',
        querystring: ListCategoriesQuerySchema,
        response: { 200: CategoryListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getCategories(request.query),
  );

  app.get(
    '/:categoryId',
    {
      schema: {
        tags: TAGS,
        summary: 'Get a category',
        params: CategoryParamsSchema,
        response: { 200: CategoryResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getCategory(request.params.categoryId),
  );

  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'Create a category',
        body: CreateCategorySchema,
        response: { 201: CategoryResponseSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const category = await addCategory(request.body);

      return reply.code(201).send(category);
    },
  );

  app.patch(
    '/:categoryId',
    {
      schema: {
        tags: TAGS,
        summary: 'Update a category',
        params: CategoryParamsSchema,
        body: UpdateCategorySchema,
        response: {
          200: CategoryResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => updateCategory(request.params.categoryId, request.body),
  );

  app.delete(
    '/:categoryId',
    {
      schema: {
        tags: TAGS,
        summary: 'Delete a category (409 while funkos still use it)',
        params: CategoryParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteCategory(request.params.categoryId);

      return reply.code(204).send();
    },
  );
};
