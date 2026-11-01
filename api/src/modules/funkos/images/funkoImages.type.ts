// What the parent funkos module embeds from images (the funko detail lists them): the image shape as a zod
// schema for its response contract, and its type.
import { z } from 'zod';

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
    // Who uploaded it; null once that user was deleted (shown as "Removed user").
    uploadedBy: z.object({ id: z.number().int(), name: z.string() }).nullable(),
  })
  .meta({ id: 'FunkoImage' });

export type FunkoImageResponse = z.infer<typeof FunkoImageResponseSchema>;
