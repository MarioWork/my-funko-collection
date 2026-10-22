import { z } from 'zod';

export const ROTATION_DEGREES = [90, 180, 270] as const;

export const FunkoImageParamsSchema = z.object({
  funkoId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});

export const ImageFromUrlSchema = z.strictObject({
  url: z.url({ protocol: /^https?$/ }),
});

export const ReorderImagesSchema = z.strictObject({
  imageIds: z.array(z.number().int().positive()).min(1),
});

export const RotateImageSchema = z.strictObject({
  degrees: z.literal(ROTATION_DEGREES),
});

export const FunkoImageResponseSchema = z
  .object({
    id: z.number().int(),
    url: z.string(),
    mediumUrl: z.string(),
    smallUrl: z.string(),
    placeholder: z.string(),
    width: z.number().int(),
    height: z.number().int(),
    sizeBytes: z.number().int(),
    position: z.number().int(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'FunkoImage' });

export const FunkoImageListResponseSchema = z.array(FunkoImageResponseSchema);

export type ReorderImages = z.infer<typeof ReorderImagesSchema>;
export type RotateImage = z.infer<typeof RotateImageSchema>;
export type FunkoImageResponse = z.infer<typeof FunkoImageResponseSchema>;
