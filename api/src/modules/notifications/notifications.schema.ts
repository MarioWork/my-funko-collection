import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { NOTIFICATION_KINDS } from './notifications.type.ts';

export const NotificationParamsSchema = z.object({
  notificationId: IdParamSchema,
});

// Always newest first: a list of messages has no other useful order.
export const ListNotificationsQuerySchema = PaginationQuerySchema.pick({ page: true, size: true });

// Opening a notification marks it read; `false` makes it unread again.
export const UpdateNotificationSchema = z.strictObject({
  isRead: z.boolean(),
});

// "Mark all read". Only `true`: nothing marks every notification unread.
export const UpdateAllNotificationsSchema = z.strictObject({
  isRead: z.literal(true),
});

// `funkoId` is the funko to open (null once it was deleted; `funkoName` stays as it was written). `reason` is the
// rejection reason for SUBMISSION_REJECTED, null otherwise.
export const NotificationResponseSchema = z
  .object({
    id: z.number().int(),
    kind: z.enum(NOTIFICATION_KINDS),
    funkoId: z.number().int().nullable(),
    funkoName: z.string(),
    reason: z.string().nullable(),
    isRead: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Notification' });

export const NotificationListResponseSchema = paginatedResponseSchema(NotificationResponseSchema);

export const UnreadCountResponseSchema = z.object({
  count: z.number().int(),
});

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
