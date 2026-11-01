import { CircleCheck, CircleX, Inbox, Merge, RotateCcw, Trash2, type LucideIcon } from 'lucide-react';
import type { NotificationApiModel } from '@app-types/models';
import { NotificationKindUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';

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
  [NotificationKindUtil.SUBMISSION_MERGED]: {
    icon: Merge,
    title: (funkoName) => `Your submission was merged into ${funkoName}`,
    detail: 'The catalogue already had it. Your items are on that funko now.',
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

function funkoPageOf(funkoId: number): string {
  return FUNKO_ROUTES_PATHS.detail(String(funkoId));
}

// Where opening each kind goes: the funko's page. For a submission sent in, sent again or rejected, that is the
// submission itself, with its review (an admin and its sender may open it); for a merge, the catalogue funko it went
// into. A removed funko is gone: nothing to open.
const NOTIFICATION_TARGETS: Record<NotificationKindUtil, ((funkoId: number) => string) | null> = {
  [NotificationKindUtil.SUBMISSION_APPROVED]: funkoPageOf,
  [NotificationKindUtil.SUBMISSION_REJECTED]: funkoPageOf,
  [NotificationKindUtil.SUBMISSION_MERGED]: funkoPageOf,
  [NotificationKindUtil.SUBMISSION_SENT]: funkoPageOf,
  [NotificationKindUtil.SUBMISSION_RESENT]: funkoPageOf,
  [NotificationKindUtil.FUNKO_REMOVED]: null,
};

// Undefined once the funko was deleted, or for a kind with nothing to open.
export function targetOf({ kind, funkoId }: NotificationApiModel): string | undefined {
  const target = NOTIFICATION_TARGETS[kind];

  if (funkoId === null || target === null) return undefined;

  return target(funkoId);
}
