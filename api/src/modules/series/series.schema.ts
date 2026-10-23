import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { SERIES_SORT_FIELDS, series } from '../../db/schema/series.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { ContainsQuerySchema } from '../../lib/queryParams.ts';

export const SERIES_NAME_MAX_LENGTH = 100;

export const SeriesParamsSchema = z.object({
  seriesId: z.coerce.number().int().positive(),
});

const SeriesInsertSchema = createInsertSchema(series, {
  name: (schema) => schema.trim().min(1).max(SERIES_NAME_MAX_LENGTH),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const CreateSeriesSchema = z.strictObject(SeriesInsertSchema.shape);

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
