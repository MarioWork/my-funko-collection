// Notifications inside the app: what other modules call to tell a user something, and what a user reads and clears.
// A user only ever sees their own; another user's notification answers 404, like one that does not exist.
//
// Kept for 90 days. There is no scheduler: reads leave out anything older, and every write deletes everyone's older
// rows in the same transaction, so the table never holds much more than the last 90 days.
import { NotFoundError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { getAdminIds } from '../users/users.service.ts';
import { notificationsRepository, type NewNotifications, type NotificationRow } from './notifications.repository.ts';
import type {
  ListNotificationsQuery,
  NotificationListResponse,
  NotificationResponse,
  UnreadCountResponse,
  UpdateNotification,
} from './notifications.schema.ts';
import type { NotifiedFunko } from './notifications.type.ts';

const ENTITY = 'Notification';
const RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

const log = logger.child({ module: 'notifications' });

// The oldest a notification may be and still count.
function retentionCutoff(): Date {
  return new Date(Date.now() - RETENTION_DAYS * DAY_MS);
}

function toResponse(row: NotificationRow): NotificationResponse {
  return {
    id: row.id,
    kind: row.kind,
    funkoId: row.funkoId,
    funkoName: row.funkoName,
    reason: row.reason,
    isRead: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function notify(notifications: NewNotifications): Promise<void> {
  if (notifications.userIds.length === 0) return;

  await notificationsRepository.createAndTrim(notifications, retentionCutoff());

  log.info({ kind: notifications.kind, funkoId: notifications.funkoId }, 'notification written');
}

// To the sender: an admin approved their submission.
export async function notifySubmissionApproved(senderId: number, funko: NotifiedFunko): Promise<void> {
  await notify({ userIds: [senderId], kind: 'SUBMISSION_APPROVED', ...funko, reason: null });
}

// To the sender: an admin rejected their submission, and why.
export async function notifySubmissionRejected(senderId: number, funko: NotifiedFunko, reason: string): Promise<void> {
  await notify({ userIds: [senderId], kind: 'SUBMISSION_REJECTED', ...funko, reason });
}

// To every admin (read-only ones too: they still read): a member sent a submission in, new or again after a
// rejection.
export async function notifyAdminsOfSubmission(funko: NotifiedFunko, isResent: boolean): Promise<void> {
  const kind = isResent ? 'SUBMISSION_RESENT' : 'SUBMISSION_SENT';

  await notify({ userIds: await getAdminIds(), kind, ...funko, reason: null });
}

export async function getNotifications(
  userId: number,
  query: ListNotificationsQuery,
): Promise<NotificationListResponse> {
  const { data, totalResultNumber } = await notificationsRepository.list(userId, retentionCutoff(), query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getUnreadCount(userId: number): Promise<UnreadCountResponse> {
  return { count: await notificationsRepository.countUnread(userId, retentionCutoff()) };
}

export async function updateNotification(
  userId: number,
  id: number,
  { isRead }: UpdateNotification,
): Promise<NotificationResponse> {
  const readAt = isRead ? new Date() : null;
  const row = await notificationsRepository.setReadAt(userId, id, readAt, retentionCutoff());

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await notificationsRepository.markAllRead(userId, new Date(), retentionCutoff());
}
