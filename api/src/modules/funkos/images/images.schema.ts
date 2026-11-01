import { z } from 'zod';
import { IdParamSchema, IdSchema } from '../../../lib/ids.ts';
import { FunkoImageResponseSchema } from './images.type.ts';

export const ROTATION_DEGREES = [90, 180, 270] as const;

// Mounted under /funkos/:funkoId/images.
export const FunkoImagesParamsSchema = z.object({
  funkoId: IdParamSchema,
});

export const FunkoImageParamsSchema = FunkoImagesParamsSchema.extend({
  imageId: IdParamSchema,
});

export const ImageFromUrlSchema = z.strictObject({
  url: z.url({ protocol: /^https?$/ }),
});

export const ReorderImagesSchema = z.strictObject({
  imageIds: z.array(IdSchema).min(1),
});

export const RotateImageSchema = z.strictObject({
  degrees: z.literal(ROTATION_DEGREES),
});

export const FunkoImageListResponseSchema = z.array(FunkoImageResponseSchema);

export type ReorderImages = z.infer<typeof ReorderImagesSchema>;
export type RotateImage = z.infer<typeof RotateImageSchema>;
