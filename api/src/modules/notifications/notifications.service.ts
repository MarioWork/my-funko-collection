// Notifications inside the app: what other modules call to tell a user something, and what a user reads and clears.
// A user only ever sees their own; another user's notification answers 404, like one that does not exist.
//
// Kept for 90 days. There is no scheduler: reads leave out anything older, and every write deletes everyone's older
// rows in the same transaction, so the table never holds much more than the last 90 days.
import { NotFoundError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import { getAdminIds } from '../users/basics/basics.service.ts';
import { notificationsRepository, type NewNotification, type NotificationRow } from './notifications.repository.ts';
import type {
  ListNotificationsQuery,
  NotificationListResponse,
  NotificationResponse,
  UnreadCountResponse,
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

// Written after the change it reports, which has already been saved: a notification that fails to write is logged
// and dropped (recovered from), so the approve, reject, merge, send or delete still answers as the success it is.
async function notify(notification: NewNotification): Promise<void> {
  if (notification.userIds.length === 0) return;

  const context = { kind: notification.kind, funkoId: notification.funkoId };

  try {
    await notificationsRepository.createAndTrim(notification, retentionCutoff());
  } catch (error) {
    log.error({ ...context, err: error }, 'notification not written');

    return;
  }

  log.info(context, 'notification written');
}

// To the sender: an admin approved their submission.
export async function notifySubmissionApproved(senderId: number, funko: NotifiedFunko): Promise<void> {
  await notify({ userIds: [senderId], kind: 'SUBMISSION_APPROVED', ...funko, reason: null });
}

// To the sender: an admin rejected their submission, and why.
export async function notifySubmissionRejected(senderId: number, funko: NotifiedFunko, reason: string): Promise<void> {
  await notify({ userIds: [senderId], kind: 'SUBMISSION_REJECTED', ...funko, reason });
}

// To the sender: an admin merged their submission into `target`, a funko already in the catalogue, where their items
// now are.
export async function notifySubmissionMerged(senderId: number, target: NotifiedFunko): Promise<void> {
  await notify({ userIds: [senderId], kind: 'SUBMISSION_MERGED', ...target, reason: null });
}

// To every admin (read-only ones too: they still read): a member sent a new submission in.
export async function notifyAdminsOfNewSubmission(funko: NotifiedFunko): Promise<void> {
  await notify({ userIds: await getAdminIds(), kind: 'SUBMISSION_SENT', ...funko, reason: null });
}

// To every admin: a member sent a rejected submission in again.
export async function notifyAdminsOfResentSubmission(funko: NotifiedFunko): Promise<void> {
  await notify({ userIds: await getAdminIds(), kind: 'SUBMISSION_RESENT', ...funko, reason: null });
}

// To every user who had it in a collection: an admin deleted the funko from the catalogue, and why. The funko is
// gone, so the notification keeps only its name.
export async function notifyFunkoRemoved(userIds: number[], funkoName: string, reason: string): Promise<void> {
  await notify({ userIds, kind: 'FUNKO_REMOVED', funkoId: null, funkoName, reason });
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

// Marks it read (the only change a notification takes); reading it again moves the time forward.
export async function updateNotification(userId: number, id: number): Promise<NotificationResponse> {
  const row = await notificationsRepository.setReadAt(userId, id, new Date(), retentionCutoff());

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function updateAllNotifications(userId: number): Promise<void> {
  await notificationsRepository.markAllRead(userId, new Date(), retentionCutoff());
}
