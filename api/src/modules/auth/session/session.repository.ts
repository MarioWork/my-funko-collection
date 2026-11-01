import type { Prisma } from '../../../generated/prisma/client.ts';
import { prisma } from '../../../lib/prisma.ts';
import { deleteSession } from '../auth.repository.ts';

const SESSION_SELECT = {
  tokenHash: true,
  userId: true,
  signedInAt: true,
  lastSeenAt: true,
  user: { select: { name: true, username: true, role: true, isReadOnly: true, temporaryPasswordExpiresAt: true } },
} as const satisfies Prisma.SessionSelect;

async function findSession(tokenHash: string) {
  const session = await prisma.session.findUnique({ where: { tokenHash }, select: SESSION_SELECT });

  if (!session) return undefined;

  const { user, ...times } = session;

  return {
    ...times,
    userName: user.name,
    username: user.username,
    userRole: user.role,
    isReadOnly: user.isReadOnly,
    mustChangePassword: user.temporaryPasswordExpiresAt !== null,
  };
}

export const sessionRepository = {
  findSession,

  touchSession: async (tokenHash: string, lastSeenAt: Date): Promise<void> => {
    await prisma.session.updateMany({ where: { tokenHash }, data: { lastSeenAt } });
  },

  deleteSession,

  deleteUserSessions: async (userId: number): Promise<void> => {
    await prisma.session.deleteMany({ where: { userId } });
  },
};

export type SessionRow = NonNullable<Awaited<ReturnType<typeof findSession>>>;
