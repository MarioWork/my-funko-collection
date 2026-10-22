import { z } from 'zod';

const CollectionStatsSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  isDefault: z.boolean(),
  itemCount: z.number().int(),
  totalQuantity: z.number().int(),
  totalSpentCents: z.number().int(),
});

const CategoryStatsSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  funkoCount: z.number().int(),
});

export const StatsResponseSchema = z
  .object({
    funkoCount: z.number().int(),
    categoryCount: z.number().int(),
    tagCount: z.number().int(),
    imageCount: z.number().int(),
    imageBytes: z.number().int(),
    collections: z.array(CollectionStatsSchema),
    byCategory: z.array(CategoryStatsSchema),
  })
  .meta({ id: 'Stats' });

export type StatsResponse = z.infer<typeof StatsResponseSchema>;
