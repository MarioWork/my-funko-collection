import { z } from 'zod';
import { MAX_ID } from './ids.ts';

const LIST_SEPARATOR = ',';

// `?tagId=1,2` arrives as one string; this turns it into `[1, 2]` and rejects anything that is not a positive int.
export const IdListQuerySchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, context) => {
    const parts = value.split(LIST_SEPARATOR).map((part) => part.trim());
    const ids = parts.map(Number);
    const isEveryId = ids.every((id) => Number.isInteger(id) && id > 0 && id <= MAX_ID);

    if (!isEveryId) {
      context.addIssue({ code: 'custom', message: 'Expected a comma-separated list of positive integers' });

      return z.NEVER;
    }

    return [...new Set(ids)];
  });

// A query boolean: `?isChase=true`.
export const BooleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

// An optional "contains" text filter; an empty string counts as absent.
export const ContainsQuerySchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const IsoDateSchema = z.iso.date();
