// The merge route's request schema (issue #12, #39).
import { z } from 'zod';
import { env } from '../../../config/env.ts';
import { IdSchema } from '../../../lib/ids.ts';
import { MERGE_FIELDS } from './merge.type.ts';

// Each id or field at most once: a list that names one twice is a mistake in the client, not something to guess at.
function isEachOnce(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length;
}

const EACH_ONCE_MESSAGE = 'List each one once';

const MergeImageIdsSchema = z
  .array(IdSchema)
  .max(env.MAX_IMAGES_PER_FUNKO)
  .refine(isEachOnce, EACH_ONCE_MESSAGE)
  .default([]);

// The funko already in the catalogue the submission is the same as, and what it keeps (issue #39): the fields it
// takes from the submission (only ones that differ), the submission's images that move onto it, and its own images
// that go. Left out, it keeps everything of its own and takes nothing.
export const MergeSubmissionSchema = z.strictObject({
  targetFunkoId: IdSchema,
  fieldsFromSubmission: z.array(z.enum(MERGE_FIELDS)).refine(isEachOnce, EACH_ONCE_MESSAGE).default([]),
  imageIdsFromSubmission: MergeImageIdsSchema,
  removedImageIds: MergeImageIdsSchema,
});

export type MergeSubmission = z.infer<typeof MergeSubmissionSchema>;
