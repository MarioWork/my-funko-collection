// What other modules may import from funkos (node-ts-api §3): the funko shape they embed (collection items,
// suggest, submissions) as a zod schema for their response contracts, and its types. Everything else stays in
// funkos.schema.ts.
import { z } from 'zod';
import type { SubmissionStatus } from '../submissions/submissions.type.ts';
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
    series: z.object({ id: z.number().int(), name: z.string() }),
    primaryImage: PrimaryImageSchema.nullable(),
  })
  .meta({ id: 'FunkoSummary' });

// The catalogue funko a merged submission went into (submissions lists and the funko page).
export const MergedIntoSchema = z.object({ id: z.number().int(), name: z.string() }).nullable();

// A funko as the funkos and submissions repositories read it: its columns, with its category's and series' names.
export type FunkoRow = {
  id: number;
  name: string;
  number: string;
  type: FunkoType;
  isChase: boolean;
  exclusive: string;
  barcode: string | null;
  categoryId: number;
  categoryName: string;
  seriesId: number;
  seriesName: string;
  status: SubmissionStatus;
  submittedById: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// The natural key the duplicate guard checks: the columns of `funkos_identity_uidx`.
export type FunkoIdentity = Pick<FunkoRow, 'categoryId' | 'number' | 'name' | 'isChase' | 'exclusive'>;

// Where a funko stands: in the catalogue, or a submission and who sent it.
export type FunkoStanding = Pick<FunkoRow, 'status' | 'submittedById'>;

export type PrimaryImageSummary = z.infer<typeof PrimaryImageSchema>;
export type FunkoSummary = z.infer<typeof FunkoSummarySchema>;
export type FunkoResponse = z.infer<typeof FunkoResponseSchema>;
