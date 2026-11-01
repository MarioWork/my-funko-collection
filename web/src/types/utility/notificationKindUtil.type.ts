// What a notification tells its user (the API's `kind`). To the sender: their submission was approved or rejected
// (with the reason). To every admin: a member sent a submission in, new or again after a rejection. To every user
// who had it in a collection: an admin removed the funko from the catalogue (with the reason).
export const NotificationKindUtil = {
  SUBMISSION_APPROVED: 'SUBMISSION_APPROVED',
  SUBMISSION_REJECTED: 'SUBMISSION_REJECTED',
  SUBMISSION_SENT: 'SUBMISSION_SENT',
  SUBMISSION_RESENT: 'SUBMISSION_RESENT',
  FUNKO_REMOVED: 'FUNKO_REMOVED',
} as const;
export type NotificationKindUtil = (typeof NotificationKindUtil)[keyof typeof NotificationKindUtil];
