// What the users jobs share: a user's row (never the password hash), and who the working admins are.
import type { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../../lib/prisma.ts';
import type { UserRole } from '../auth/auth.type.ts';

export // Never the password hash itself: only whether there is one, through `hasPassword` below.
const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  isReadOnly: true,
  temporaryPasswordExpiresAt: true,
  createdAt: true,
  passwordHash: true,
  _count: { select: { passkeys: true } },
} as const satisfies Prisma.UserSelect;

export type SelectedUser = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

export type UserRow = Omit<SelectedUser, '_count' | 'passwordHash'> & { hasPassword: boolean; passkeyCount: number };

export type Transaction = Prisma.TransactionClient;

// What the last-admin rule looks at on a user, before or after a change.
export type AdminStanding = { role: UserRole; isReadOnly: boolean };

// An admin who can still change things: the rule keeps at least one.
const WORKING_ADMIN_WHERE = { role: 'ADMIN', isReadOnly: false } as const satisfies Prisma.UserWhereInput;

export function toRow({ _count, passwordHash, ...user }: SelectedUser): UserRow {
  return { ...user, hasPassword: passwordHash !== null, passkeyCount: _count.passkeys };
}

// Admins who are not read-only: a read-only admin can't change anything, so they don't count towards the rule.
export async function countAdmins(client: Transaction | typeof prisma = prisma): Promise<number> {
  return client.user.count({ where: WORKING_ADMIN_WHERE });
}

// An admin who is not read-only: the last-admin rule keeps at least one. The service marks that user `isLastAdmin`.
export function isWorkingAdmin({ role, isReadOnly }: AdminStanding): boolean {
  return role === 'ADMIN' && !isReadOnly;
}

export const usersRepository = {
  // Usernames are stored lower-case, so the caller lower-cases what was typed. `exceptUserId` is the user the
  // username is for: their own does not count as taken.
  isUsernameTaken: async (username: string, exceptUserId?: number): Promise<boolean> => {
    const holders = await prisma.user.count({ where: { username, id: { not: exceptUserId } } });

    return holders > 0;
  },

  findById: async (id: number): Promise<UserRow | undefined> => {
    const row = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });

    return row ? toRow(row) : undefined;
  },

  countAdmins: (): Promise<number> => countAdmins(),
};
