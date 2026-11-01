// The submissions routes' own request schemas. What other modules share is in submissions.type.ts.
import { z } from 'zod';
import { env } from '../../config/env.ts';
import { IdParamSchema, IdSchema } from '../../lib/ids.ts';
import { MERGE_FIELDS } from '../funkos/funkos.type.ts';

export const REJECTION_REASON_MAX_LENGTH = 500;

export const SubmissionParamsSchema = z.object({
  funkoId: IdParamSchema,
});

// The reason the sender reads: required (a check in the submission_reviews migration holds the same length).
export const RejectSubmissionSchema = z.strictObject({
  reason: z.string().trim().min(1).max(REJECTION_REASON_MAX_LENGTH),
});

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

export type RejectSubmission = z.infer<typeof RejectSubmissionSchema>;
export type MergeSubmission = z.infer<typeof MergeSubmissionSchema>;
