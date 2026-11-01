// The submissions routes' own request schemas. What other modules share is in submissions.type.ts.
import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';

export const REJECTION_REASON_MAX_LENGTH = 500;

export const SubmissionParamsSchema = z.object({
  funkoId: IdParamSchema,
});

// The reason the sender reads: required (a check in the submission_reviews migration holds the same length).
export const RejectSubmissionSchema = z.strictObject({
  reason: z.string().trim().min(1).max(REJECTION_REASON_MAX_LENGTH),
});

export type RejectSubmission = z.infer<typeof RejectSubmissionSchema>;
