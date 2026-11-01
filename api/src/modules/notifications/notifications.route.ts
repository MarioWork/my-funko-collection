import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { signedInUserId } from '../../plugins/auth.plugin.ts';
import {
  ListNotificationsQuerySchema,
  NotificationListResponseSchema,
  NotificationParamsSchema,
  NotificationResponseSchema,
  UnreadCountResponseSchema,
  UpdateAllNotificationsSchema,
  UpdateNotificationSchema,
} from './notifications.schema.ts';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  updateNotification,
} from './notifications.service.ts';

const TAGS = ['notifications'];

// Every route works on the signed-in user's own notifications. Marking them read is open to a read-only user: it
// changes nothing but their own messages.
export const notificationsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: "The signed-in user's notifications from the last 90 days, newest first",
        querystring: ListNotificationsQuerySchema,
        response: { 200: NotificationListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getNotifications(signedInUserId(request), request.query),
  );

  app.get(
    '/unread-count',
    {
      schema: {
        tags: TAGS,
        summary: "How many of the signed-in user's notifications are unread (the bell's count)",
        response: { 200: UnreadCountResponseSchema },
      },
    },
    async (request) => getUnreadCount(signedInUserId(request)),
  );

  app.patch(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      config: { isAllowedWhenReadOnly: true },
      schema: {
        tags: TAGS,
        summary: "Mark every one of the signed-in user's notifications read",
        body: UpdateAllNotificationsSchema,
        response: { 204: z.undefined(), 400: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      await markAllNotificationsRead(signedInUserId(request));

      return reply.code(204).send();
    },
  );

  app.patch(
    '/:notificationId',
    {
      config: { isAllowedWhenReadOnly: true },
      schema: {
        tags: TAGS,
        summary: 'Mark one notification read (or unread again)',
        params: NotificationParamsSchema,
        body: UpdateNotificationSchema,
        response: { 200: NotificationResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => updateNotification(signedInUserId(request), request.params.notificationId, request.body),
  );
};
