// What other modules may import from funkos (node-ts-api §3): the funko shape they embed (collection items,
// suggest) as a zod schema for their response contracts, and its types. Everything else stays in funkos.schema.ts.
import { z } from 'zod';
import type { FunkoResponseSchema } from './funkos.schema.ts';

// Matches the `FunkoType` enum in prisma/schema.prisma; the repositories fail to compile if the two drift apart.
export const FUNKO_TYPES = [
  'POP',
  'POP_DELUXE',
  'POP_RIDES',
  'POP_MOMENT',
  'POP_TOWN',
  'POP_ALBUM',
  'POP_JUMBO',
  'POP_KEYCHAIN',
  'SODA',
  'BITTY_POP',
  'MYSTERY_MINI',
  'OTHER',
] as const;
export type FunkoType = (typeof FUNKO_TYPES)[number];

export const PrimaryImageSchema = z
  .object({
    smallUrl: z.string(),
    mediumUrl: z.string(),
    placeholder: z.string(),
    width: z.number().int(),
    height: z.number().int(),
  })
  .meta({ id: 'PrimaryImage' });

export const FunkoSummarySchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    number: z.string(),
    type: z.enum(FUNKO_TYPES),
    isChase: z.boolean(),
    exclusive: z.string(),
    barcode: z.string().nullable(),
    category: z.object({ id: z.number().int(), name: z.string() }),
    series: z.object({ id: z.number().int(), name: z.string() }).nullable(),
    primaryImage: PrimaryImageSchema.nullable(),
  })
  .meta({ id: 'FunkoSummary' });

export type PrimaryImageSummary = z.infer<typeof PrimaryImageSchema>;
export type FunkoSummary = z.infer<typeof FunkoSummarySchema>;
export type FunkoResponse = z.infer<typeof FunkoResponseSchema>;
