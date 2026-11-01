import type { NotificationKindUtil } from '@app-types/utility';

// One of the signed-in user's notifications (GET /notifications). `funkoId` is the funko it is about, null once that
// funko was deleted (always for FUNKO_REMOVED); `funkoName` is its name when the notification was written.
// `reason`: why a submission was rejected or a funko removed, null for the other kinds.
export interface NotificationApiModel {
  id: number;
  kind: NotificationKindUtil;
  funkoId: number | null;
  funkoName: string;
  reason: string | null;
  isRead: boolean;
  createdAt: string;
}

export type NotificationId = NotificationApiModel['id'];
