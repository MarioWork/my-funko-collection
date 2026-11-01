// What the notification handlers share, and what other handlers call to tell someone something, as the API's
// notifications service does: approving or rejecting tells the sender, a new or resent submission every admin, a
// forced delete every user who had the funko.
import type { NotificationApiModel } from '@app-types/models';
import { NotificationKindUtil, UserRoleUtil } from '@app-types/utility';
import { MOCK_USER_ID } from '@mocks/mockAuth';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockNotificationRow } from '@mocks/mockStore.type';
import { nextId, nowIso } from '@mocks/mockStoreUtils';

function notifiedFunkoOf(funko: MockFunkoRow): NotifiedFunko {
  return { funkoId: funko.id, funkoName: funko.name };
}

export function toNotificationModel({ userId: _userId, ...row }: MockNotificationRow): NotificationApiModel {
  return row;
}

// Only the signed-in user's own, newest first (a copy: the store's order stays as it is).
export function ownNotifications(): MockNotificationRow[] {
  return mockStore.notifications
    .filter((row) => row.userId === MOCK_USER_ID)
    .toSorted((first, second) => second.createdAt.localeCompare(first.createdAt) || second.id - first.id);
}

export function findOwnNotification(notificationId: string): MockNotificationRow | undefined {
  return mockStore.notifications.find((row) => row.userId === MOCK_USER_ID && String(row.id) === notificationId);
}

// A deleted funko leaves its notifications behind with no link (the API clears `funko_id`, keeping the name).
export function forgetNotifiedFunkos(funkoIds: Set<number>): void {
  for (const row of mockStore.notifications) {
    if (row.funkoId !== null && funkoIds.has(row.funkoId)) row.funkoId = null;
  }
}

// A deleted user's notifications go with them, as the API's cascade does.
export function dropNotificationsOf(userId: number): void {
  mockStore.notifications = mockStore.notifications.filter((row) => row.userId !== userId);
}

// Every admin: the other users who are admins, and the signed-in user while they are one.
function adminIds(): number[] {
  const otherAdminIds = mockStore.users.filter((user) => user.role === UserRoleUtil.ADMIN).map((user) => user.id);
  const isMockUserAdmin = mockStore.auth.role === UserRoleUtil.ADMIN;

  return isMockUserAdmin ? [MOCK_USER_ID, ...otherAdminIds] : otherAdminIds;
}

// The funko a notification names: null `funkoId` once it is gone, its name kept.
type NotifiedFunko = { funkoId: number | null; funkoName: string };

function notify(userIds: number[], kind: NotificationKindUtil, funko: NotifiedFunko, reason: string | null): void {
  for (const userId of userIds) {
    mockStore.notifications.push({
      id: nextId(mockStore.notifications),
      userId,
      kind,
      ...funko,
      reason,
      isRead: false,
      createdAt: nowIso(),
    });
  }
}

// To the sender, unless it is an orphan submission (nobody left to tell).
export function notifyMockSender(kind: NotificationKindUtil, funko: MockFunkoRow, reason: string | null = null): void {
  if (funko.submittedById === null) return;

  notify([funko.submittedById], kind, notifiedFunkoOf(funko), reason);
}

export function notifyMockAdmins(kind: NotificationKindUtil, funko: MockFunkoRow): void {
  notify(adminIds(), kind, notifiedFunkoOf(funko), null);
}

// To every user who had it: an admin deleted the funko, and why. It is gone, so only its name is kept.
export function notifyMockFunkoRemoved(userIds: number[], funkoName: string, reason: string): void {
  notify(userIds, NotificationKindUtil.FUNKO_REMOVED, { funkoId: null, funkoName }, reason);
}
