import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import {
  CreateSeriesSchema,
  ListSeriesQuerySchema,
  SeriesListResponseSchema,
  SeriesParamsSchema,
  SeriesResponseSchema,
  UpdateSeriesSchema,
} from './series.schema.ts';
import { addSeries, deleteSeries, getSeries, getSeriesList, updateSeries } from './series.service.ts';

const TAGS = ['series'];

export const seriesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List series',
        querystring: ListSeriesQuerySchema,
        response: { 200: SeriesListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getSeriesList(request.query),
  );

  app.get(
    '/:seriesId',
    {
      schema: {
        tags: TAGS,
        summary: 'Get a series',
        params: SeriesParamsSchema,
        response: { 200: SeriesResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => getSeries(request.params.seriesId),
  );

  app.post(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'Create a series',
        body: CreateSeriesSchema,
        response: { 201: SeriesResponseSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const created = await addSeries(request.body);

      return reply.code(201).send(created);
    },
  );

  app.patch(
    '/:seriesId',
    {
      schema: {
        tags: TAGS,
        summary: 'Update a series',
        params: SeriesParamsSchema,
        body: UpdateSeriesSchema,
        response: {
          200: SeriesResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => updateSeries(request.params.seriesId, request.body),
  );

  app.delete(
    '/:seriesId',
    {
      schema: {
        tags: TAGS,
        summary: 'Delete a series (its funkos keep existing, without a series)',
        params: SeriesParamsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await deleteSeries(request.params.seriesId);

      return reply.code(204).send();
    },
  );
};
