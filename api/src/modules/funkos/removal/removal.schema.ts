// The delete route's schemas (issue #13).
import { z } from 'zod';
import { BooleanQuerySchema } from '../../../lib/queryParams.ts';

export const REMOVAL_REASON_MAX_LENGTH = 500;

// `force=true` removes the funko from every collection first; without it a funko in a collection answers 409.
export const DeleteFunkoQuerySchema = z.object({
  force: BooleanQuerySchema.default(false),
});

// Why the funko goes: needed on a forced delete that takes it out of other users' collections, and sent to each of
// them in a notification. In the body, not the query, so the text stays out of request logs. The same length as the
// notifications' check.
export const DeleteFunkoSchema = z.strictObject({
  reason: z.string().trim().min(1).max(REMOVAL_REASON_MAX_LENGTH),
});

export type DeleteFunkoQuery = z.infer<typeof DeleteFunkoQuerySchema>;
export type DeleteFunko = z.infer<typeof DeleteFunkoSchema>;
