// What other modules may import from submissions (node-ts-api §3): where a funko, category or series stands in the
// catalogue (all three carry it), and the shape of one submission, which every submissions job answers with.
import { z } from 'zod';
import { FunkoSummarySchema, MergedIntoSchema } from '../funkos/funkos.type.ts';

// Matches the `SubmissionStatus` enum in prisma/schema.prisma; the repositories fail to compile if the two drift.
// APPROVED is the catalogue everyone sees; the others are a submission only its sender (and admins) see.
export const SUBMISSION_STATUSES = ['WAITING', 'APPROVED', 'REJECTED', 'MERGED'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

// One funko the signed-in user sent in, with where it stands; `createdAt` is when they sent it. `reviewedAt`: when
// an admin last approved, rejected or merged it (kept when a rejected one is sent again); `rejectionReason` while it is
// rejected; `changedByAdminAt`: when an admin last changed it before approving it; `mergedInto`: the catalogue funko a
// merged one went into (null otherwise, or once that funko was deleted).
export const SubmissionResponseSchema = FunkoSummarySchema.extend({
  status: z.enum(SUBMISSION_STATUSES),
  reviewedAt: z.iso.datetime().nullable(),
  rejectionReason: z.string().nullable(),
  changedByAdminAt: z.iso.datetime().nullable(),
  mergedInto: MergedIntoSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Submission' });

export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
