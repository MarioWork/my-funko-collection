import type { SubmissionResponse } from '../submissions.type.ts';

// What became of a rejection: a member's submission is rejected (and returned), an orphan submission is deleted.
export type RejectionOutcome = { isDeleted: false; submission: SubmissionResponse } | { isDeleted: true };
