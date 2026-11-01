import { CircleCheck, CircleX, Inbox, RotateCcw, Trash2, type LucideIcon } from 'lucide-react';
import type { NotificationApiModel } from '@app-types/models';
import { NotificationKindUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS, SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';

// The API's largest page: 90 days of notifications for a few people fit in one.
export const NOTIFICATION_PAGE_SIZE = '100';

type NotificationWording = {
  icon: LucideIcon;
  title: (funkoName: string) => string;
  // The line under the title; a rejection or a removal shows its reason instead.
  detail: string;
};

// What each kind says, in the glossary's words.
export const NOTIFICATION_WORDING: Record<NotificationKindUtil, NotificationWording> = {
  [NotificationKindUtil.SUBMISSION_APPROVED]: {
    icon: CircleCheck,
    title: (funkoName) => `${funkoName} was approved`,
    detail: 'It is in the catalogue for everyone now.',
  },
  [NotificationKindUtil.SUBMISSION_REJECTED]: {
    icon: CircleX,
    title: (funkoName) => `${funkoName} was rejected`,
    detail: 'You can change it and send it again.',
  },
  [NotificationKindUtil.SUBMISSION_SENT]: {
    icon: Inbox,
    title: (funkoName) => `New submission: ${funkoName}`,
    detail: 'Waiting for an admin to review it.',
  },
  [NotificationKindUtil.SUBMISSION_RESENT]: {
    icon: RotateCcw,
    title: (funkoName) => `${funkoName} was sent in again`,
    detail: 'Waiting for an admin to review it.',
  },
  [NotificationKindUtil.FUNKO_REMOVED]: {
    icon: Trash2,
    title: (funkoName) => `${funkoName} was removed from the catalogue`,
    detail: 'An admin deleted it, and it is gone from your collections.',
  },
};

// Where opening each kind goes: an approved funko's page, the sender's own submissions (to fix and send again), or
// the admins' review list. A removed funko is gone: nothing to open.
const NOTIFICATION_TARGETS: Record<NotificationKindUtil, ((funkoId: number) => string) | null> = {
  [NotificationKindUtil.SUBMISSION_APPROVED]: (funkoId) => FUNKO_ROUTES_PATHS.detail(String(funkoId)),
  [NotificationKindUtil.SUBMISSION_REJECTED]: () => SUBMISSION_ROUTES_PATHS.BASE,
  [NotificationKindUtil.SUBMISSION_SENT]: () => SUBMISSION_ROUTES_PATHS.REVIEW,
  [NotificationKindUtil.SUBMISSION_RESENT]: () => SUBMISSION_ROUTES_PATHS.REVIEW,
  [NotificationKindUtil.FUNKO_REMOVED]: null,
};

// Undefined once the funko was deleted, or for a kind with nothing to open.
export function targetOf({ kind, funkoId }: NotificationApiModel): string | undefined {
  const target = NOTIFICATION_TARGETS[kind];

  if (funkoId === null || target === null) return undefined;

  return target(funkoId);
}
