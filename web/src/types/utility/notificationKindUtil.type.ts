// What a notification tells its user (the API's `kind`). To the sender: their submission was approved or rejected
// (with the reason). To every admin: a member sent a submission in, new or again after a rejection.
export const NotificationKindUtil = {
  SUBMISSION_APPROVED: 'SUBMISSION_APPROVED',
  SUBMISSION_REJECTED: 'SUBMISSION_REJECTED',
  SUBMISSION_SENT: 'SUBMISSION_SENT',
  SUBMISSION_RESENT: 'SUBMISSION_RESENT',
} as const;
export type NotificationKindUtil = (typeof NotificationKindUtil)[keyof typeof NotificationKindUtil];
