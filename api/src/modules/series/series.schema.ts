import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { ContainsQuerySchema } from '../../lib/queryParams.ts';

export const SERIES_NAME_MAX_LENGTH = 100;

export const SERIES_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type SeriesSortField = (typeof SERIES_SORT_FIELDS)[number];

export const SeriesParamsSchema = z.object({
  seriesId: IdParamSchema,
});

export const CreateSeriesSchema = z.strictObject({
  name: z.string().trim().min(1).max(SERIES_NAME_MAX_LENGTH),
});

export const UpdateSeriesSchema = CreateSeriesSchema.partial();

export const ListSeriesQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(SERIES_SORT_FIELDS).default('NAME'),
  name: ContainsQuerySchema,
});

export const SeriesResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    funkoCount: z.number().int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'Series' });

export const SeriesListResponseSchema = paginatedResponseSchema(SeriesResponseSchema);

export type CreateSeries = z.infer<typeof CreateSeriesSchema>;
export type UpdateSeries = z.infer<typeof UpdateSeriesSchema>;
export type ListSeriesQuery = z.infer<typeof ListSeriesQuerySchema>;
export type SeriesResponse = z.infer<typeof SeriesResponseSchema>;
export type SeriesListResponse = z.infer<typeof SeriesListResponseSchema>;
