import { z } from 'zod';
import { FunkoSummarySchema } from '../funkos/funkoSummary.schema.ts';

export const SUGGEST_QUERY_MAX_LENGTH = 100;
export const SUGGEST_FUNKO_LIMIT = 5;
export const SUGGEST_OTHER_LIMIT = 3;

export const SuggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(SUGGEST_QUERY_MAX_LENGTH),
});

const NamedSchema = z.object({ id: z.number().int(), name: z.string() });

export const SuggestResponseSchema = z
  .object({
    funkos: z.array(FunkoSummarySchema),
    categories: z.array(NamedSchema),
    collections: z.array(NamedSchema),
    tags: z.array(NamedSchema),
  })
  .meta({ id: 'Suggest' });

export type SuggestQuery = z.infer<typeof SuggestQuerySchema>;
export type SuggestResponse = z.infer<typeof SuggestResponseSchema>;
