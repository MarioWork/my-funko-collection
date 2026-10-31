// Where a funko, category or series stands in the catalogue (the API's `status`). APPROVED is the catalogue everyone
// sees; a member's new one is a WAITING submission only they see until an admin approves it, rejects it, or merges
// it into one already there.
export const SubmissionStatusUtil = {
  WAITING: 'WAITING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  MERGED: 'MERGED',
} as const;
export type SubmissionStatusUtil = (typeof SubmissionStatusUtil)[keyof typeof SubmissionStatusUtil];

// Every state in words, so a chip never says it by colour alone.
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatusUtil, string> = {
  [SubmissionStatusUtil.WAITING]: 'Waiting',
  [SubmissionStatusUtil.APPROVED]: 'Approved',
  [SubmissionStatusUtil.REJECTED]: 'Rejected',
  [SubmissionStatusUtil.MERGED]: 'Merged',
};
