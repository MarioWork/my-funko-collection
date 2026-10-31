// What other modules may import from submissions (node-ts-api §3): where a funko, category or series stands in the
// catalogue (all three carry it), and the shape of the submissions list, which the funkos service fills.
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

// One funko the signed-in user sent in, with where it stands; `createdAt` is when they sent it.
export const SubmissionResponseSchema = FunkoSummarySchema.extend({
  status: z.enum(SUBMISSION_STATUSES),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Submission' });

export const SubmissionListResponseSchema = paginatedResponseSchema(SubmissionResponseSchema);

export type ListSubmissionsQuery = z.infer<typeof ListSubmissionsQuerySchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;
