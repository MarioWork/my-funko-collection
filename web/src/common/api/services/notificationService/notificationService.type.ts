import { boolean, object, type InferType } from 'yup';

// Opening a notification marks it read: the only change the API takes.
export const UpdateNotificationSchema = object({
  isRead: boolean().oneOf([true]).required(),
});

export type UpdateNotification = InferType<typeof UpdateNotificationSchema>;
