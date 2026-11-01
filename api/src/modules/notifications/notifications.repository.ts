import type { Prisma } from '../../generated/prisma/client.ts';
import { toSkipTake } from '../../lib/pagination.ts';
import { prisma, reloadIfUpdated } from '../../lib/prisma.ts';
import type { ListNotificationsQuery } from './notifications.schema.ts';
import type { NotificationKind } from './notifications.type.ts';

const NOTIFICATION_SELECT = {
  id: true,
  kind: true,
  funkoId: true,
  funkoName: true,
  reason: true,
  readAt: true,
  createdAt: true,
} as const satisfies Prisma.NotificationSelect;

export type NotificationRow = Prisma.NotificationGetPayload<{ select: typeof NOTIFICATION_SELECT }>;

// One message to write, to one or more users.
export type NewNotification = {
  userIds: number[];
  kind: NotificationKind;
  funkoId: number;
  funkoName: string;
  reason: string | null;
};

// Every read names the user and skips what is past the retention cut-off: another user's notification, or one too
// old, is simply not there.
function ownRecent(userId: number, cutoff: Date): Prisma.NotificationWhereInput {
  return { userId, createdAt: { gte: cutoff } };
}

async function findById(userId: number, id: number, cutoff: Date): Promise<NotificationRow | undefined> {
  const row = await prisma.notification.findFirst({
    where: { id, ...ownRecent(userId, cutoff) },
    select: NOTIFICATION_SELECT,
  });

  return row ?? undefined;
}

export const notificationsRepository = {
  list: async (userId: number, cutoff: Date, query: ListNotificationsQuery) => {
    const where = ownRecent(userId, cutoff);

    const [data, totalResultNumber] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        select: NOTIFICATION_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(query),
      }),
      prisma.notification.count({ where }),
    ]);

    return { data, totalResultNumber };
  },

  countUnread: (userId: number, cutoff: Date): Promise<number> =>
    prisma.notification.count({ where: { ...ownRecent(userId, cutoff), readAt: null } }),

  // Writes the new ones and deletes everyone's past the cut-off, in one go: writing is when the table grows, so that
  // is when it is trimmed.
  createAndTrim: async (notification: NewNotification, cutoff: Date): Promise<void> => {
    const { userIds, ...message } = notification;

    await prisma.$transaction([
      prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, ...message })) }),
      prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);
  },

  setReadAt: async (userId: number, id: number, readAt: Date, cutoff: Date) => {
    const write = await prisma.notification.updateMany({
      where: { id, ...ownRecent(userId, cutoff) },
      data: { readAt },
    });

    return reloadIfUpdated(write, () => findById(userId, id, cutoff));
  },

  // Only the unread ones, so an earlier readAt stays as it was.
  markAllRead: async (userId: number, readAt: Date, cutoff: Date): Promise<void> => {
    await prisma.notification.updateMany({ where: { ...ownRecent(userId, cutoff), readAt: null }, data: { readAt } });
  },
};
