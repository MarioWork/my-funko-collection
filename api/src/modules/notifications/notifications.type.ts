// What other modules may import from notifications (node-ts-api §3): the kinds a notification can be, and what a
// module hands over to tell someone something.

// Matches the `NotificationKind` enum in prisma/schema.prisma; the repository fails to compile if the two drift.
export const NOTIFICATION_KINDS = [
  'SUBMISSION_APPROVED',
  'SUBMISSION_REJECTED',
  'SUBMISSION_MERGED',
  'SUBMISSION_SENT',
  'SUBMISSION_RESENT',
  'FUNKO_REMOVED',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

// The funko a notification is about, as it is when the notification is written.
export type NotifiedFunko = {
  funkoId: number;
  funkoName: string;
};
