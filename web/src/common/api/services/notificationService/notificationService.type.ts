import { boolean, object, type InferType } from 'yup';

// Opening a notification marks it read; `false` makes it unread again.
export const UpdateNotificationSchema = object({
  isRead: boolean().required(),
});

export type UpdateNotification = InferType<typeof UpdateNotificationSchema>;
