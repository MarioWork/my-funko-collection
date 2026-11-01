// The schemas of a member's own submissions list: what they sent in, whatever became of it.
import { z } from 'zod';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../../lib/pagination.ts';
import { SUBMISSION_STATUSES, SubmissionResponseSchema } from '../submissions.type.ts';

export const SUBMISSION_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type SubmissionSortField = (typeof SUBMISSION_SORT_FIELDS)[number];

// Newest first unless asked otherwise.
export const ListSubmissionsQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(SUBMISSION_SORT_FIELDS).default('CREATION_DATE'),
  direction: PaginationQuerySchema.shape.direction.unwrap().default('DESC'),
  status: z.enum(SUBMISSION_STATUSES).optional(),
});

export const SubmissionListResponseSchema = paginatedResponseSchema(SubmissionResponseSchema);

export type ListSubmissionsQuery = z.infer<typeof ListSubmissionsQuerySchema>;
export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;
