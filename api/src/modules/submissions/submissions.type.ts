// What other modules may import from submissions (node-ts-api §3): where a funko, category or series stands in the
// catalogue (all three carry it), and the shapes of the submissions lists and reviews, which the funkos service
// fills.
import { z } from 'zod';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { FunkoSummarySchema } from '../funkos/funkos.type.ts';

// Matches the `SubmissionStatus` enum in prisma/schema.prisma; the repositories fail to compile if the two drift.
// APPROVED is the catalogue everyone sees; the others are a submission only its sender (and admins) see.
export const SUBMISSION_STATUSES = ['WAITING', 'APPROVED', 'REJECTED', 'MERGED'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type SubmissionSortField = (typeof SUBMISSION_SORT_FIELDS)[number];

// Newest first unless asked otherwise.
export const ListSubmissionsQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(SUBMISSION_SORT_FIELDS).default('CREATION_DATE'),
  direction: PaginationQuerySchema.shape.direction.unwrap().default('DESC'),
  status: z.enum(SUBMISSION_STATUSES).optional(),
});

// The admins' review list: WAITING is every waiting submission, oldest first; DONE every reviewed one (approved,
// rejected or merged), last reviewed first.
export const REVIEW_STATES = ['WAITING', 'DONE'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export const ListReviewQuerySchema = PaginationQuerySchema.pick({ page: true, size: true }).extend({
  state: z.enum(REVIEW_STATES).default('WAITING'),
});

// One funko the signed-in user sent in, with where it stands; `createdAt` is when they sent it. `reviewedAt`: when
// an admin last approved or rejected it (kept when a rejected one is sent again); `rejectionReason` while it is
// rejected; `changedByAdminAt`: when an admin last changed it before approving it.
export const SubmissionResponseSchema = FunkoSummarySchema.extend({
  status: z.enum(SUBMISSION_STATUSES),
  reviewedAt: z.iso.datetime().nullable(),
  rejectionReason: z.string().nullable(),
  changedByAdminAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Submission' });

export const SubmissionListResponseSchema = paginatedResponseSchema(SubmissionResponseSchema);

// Why another funko may be the same one: the same barcode, or the same number in a category of the same name.
export const DOUBLE_MATCH_FIELDS = ['BARCODE', 'NUMBER_AND_CATEGORY'] as const;
export type DoubleMatchField = (typeof DOUBLE_MATCH_FIELDS)[number];

// Another approved or waiting funko a waiting submission may be a double of.
export const PossibleDoubleSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  number: z.string(),
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

export type ListSubmissionsQuery = z.infer<typeof ListSubmissionsQuerySchema>;
export type ListReviewQuery = z.infer<typeof ListReviewQuerySchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;
export type PossibleDouble = z.infer<typeof PossibleDoubleSchema>;
export type ReviewSubmissionResponse = z.infer<typeof ReviewSubmissionResponseSchema>;
export type ReviewSubmissionListResponse = z.infer<typeof ReviewSubmissionListResponseSchema>;
