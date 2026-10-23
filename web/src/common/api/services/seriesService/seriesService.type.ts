import { object, type InferType } from 'yup';
import { seriesNameSchema } from '@utils/seriesUtils';

export const CreateSeriesSchema = object({
  name: seriesNameSchema,
});

export const UpdateSeriesSchema = CreateSeriesSchema.partial();

export type CreateSeries = InferType<typeof CreateSeriesSchema>;
export type UpdateSeries = InferType<typeof UpdateSeriesSchema>;
