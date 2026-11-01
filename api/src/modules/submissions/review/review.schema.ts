// The review routes' schemas (issue #10): the admins' list, with the funkos each waiting one may be a double of, and
// the rejection body.
import { z } from 'zod';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../../lib/pagination.ts';
import { SUBMISSION_STATUSES, SubmissionResponseSchema } from '../submissions.type.ts';

export const REJECTION_REASON_MAX_LENGTH = 500;

// The admins' review list: WAITING is every waiting submission, oldest first; DONE every reviewed one (approved,
// rejected or merged), last reviewed first.
export const REVIEW_STATES = ['WAITING', 'DONE'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export const ListReviewQuerySchema = PaginationQuerySchema.pick({ page: true, size: true }).extend({
  state: z.enum(REVIEW_STATES).default('WAITING'),
});

// Why another funko may be the same one: the same barcode, or the same number in a category of the same name.
export const DOUBLE_MATCH_FIELDS = ['BARCODE', 'NUMBER_AND_CATEGORY'] as const;
export type DoubleMatchField = (typeof DOUBLE_MATCH_FIELDS)[number];

// Another approved or waiting funko a waiting submission may be a double of, with its chase and exclusive so a regular
// and a chase of the same number and name read apart ("" exclusive: a regular release).
export const PossibleDoubleSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  number: z.string(),
  isChase: z.boolean(),
  exclusive: z.string(),
  status: z.enum(SUBMISSION_STATUSES),
  matchedOn: z.array(z.enum(DOUBLE_MATCH_FIELDS)),
});

// A submission as an admin reviews it: who sent it in (null for a removed user) and, while it waits, the funkos it
// may be a double of.
export const ReviewSubmissionResponseSchema = SubmissionResponseSchema.extend({
  submittedBy: z.object({ id: z.number().int(), name: z.string() }).nullable(),
  possibleDoubles: z.array(PossibleDoubleSchema),
}).meta({ id: 'ReviewSubmission' });

export const ReviewSubmissionListResponseSchema = paginatedResponseSchema(ReviewSubmissionResponseSchema);

// The reason the sender reads: required (a check in the submission_reviews migration holds the same length).
export const RejectSubmissionSchema = z.strictObject({
  reason: z.string().trim().min(1).max(REJECTION_REASON_MAX_LENGTH),
});

export type ListReviewQuery = z.infer<typeof ListReviewQuerySchema>;
export type PossibleDouble = z.infer<typeof PossibleDoubleSchema>;
export type ReviewSubmissionResponse = z.infer<typeof ReviewSubmissionResponseSchema>;
export type ReviewSubmissionListResponse = z.infer<typeof ReviewSubmissionListResponseSchema>;
export type RejectSubmission = z.infer<typeof RejectSubmissionSchema>;
