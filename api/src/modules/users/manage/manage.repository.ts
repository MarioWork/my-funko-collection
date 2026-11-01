import { prisma } from '../../../lib/prisma.ts';
import {
  USER_SELECT,
  countAdmins,
  isWorkingAdmin,
  toRow,
  type AdminStanding,
  type Transaction,
  type UserRow,
} from '../users.repository.ts';
import type { UpdateUser } from './manage.schema.ts';

type NewPassword = {
  username: string;
  passwordHash: string;
  temporaryPasswordExpiresAt: Date;
};

// What a guarded change did: the user as it is now, missing (no such user), or refused because it would leave
// no admin.
export type GuardedChange<Result> = { result: Result } | { isMissing: true } | { isLastAdmin: true };

// Two admins demoting or deleting each other at once would both count two admins under Postgres's default
// isolation. The lock makes the second wait for the first to commit, then count again. It ends with the
// transaction (the same lock auth/setup/setup.repository.ts takes for first-run setup).
async function lockUsers(tx: Transaction): Promise<void> {
  await tx.$executeRaw`lock table users in share row exclusive mode`;
}

// Runs `change` on an existing user inside one locked transaction, unless it would take away the last admin who
// can change things: that is when the user is one, `isLeavingAdmins` says the change ends that, and they are the
// only one.
async function guardLastAdmin<Result>(
  userId: number,
  isLeavingAdmins: (current: AdminStanding) => boolean,
  change: (tx: Transaction, current: AdminStanding) => Promise<Result>,
): Promise<GuardedChange<Result>> {
  return prisma.$transaction(async (tx) => {
    await lockUsers(tx);

    const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true, isReadOnly: true } });

    if (!user) return { isMissing: true };

    const isOnlyAdmin = isWorkingAdmin(user) && (await countAdmins(tx)) === 1;

    if (isOnlyAdmin && isLeavingAdmins(user)) return { isLastAdmin: true };

    return { result: await change(tx, user) };
  });
}

// The user as a change leaves them: what it sends replaces what is there, what it leaves out stays.
function standingAfter(current: AdminStanding, change: UpdateUser): AdminStanding {
  return { role: change.role ?? current.role, isReadOnly: change.isReadOnly ?? current.isReadOnly };
}

function isSameStanding(current: AdminStanding, next: AdminStanding): boolean {
  return current.role === next.role && current.isReadOnly === next.isReadOnly;
}

export const manageRepository = {
  // A new role or read-only setting, and every session of the user ends with it, in one go. A change that leaves
  // both as they were keeps the sessions.
  update: (userId: number, change: UpdateUser): Promise<GuardedChange<UserRow>> =>
    guardLastAdmin(
      userId,
      (current) => !isWorkingAdmin(standingAfter(current, change)),
      async (tx, current) => {
        const next = standingAfter(current, change);

        if (!isSameStanding(current, next)) {
          await tx.user.update({ where: { id: userId }, data: next, select: { id: true } });
          await tx.session.deleteMany({ where: { userId } });
        }

        return toRow(await tx.user.findUniqueOrThrow({ where: { id: userId }, select: USER_SELECT }));
      },
    ),

  // A new temporary password (and username, when one is given) replaces the old password, and every session of
  // the user ends, in one go. Undefined when there is no such user.
  setTemporaryPassword: (userId: number, password: NewPassword): Promise<UserRow | undefined> =>
    prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({ where: { id: userId }, data: password });

      if (updated.count === 0) return undefined;

      await tx.session.deleteMany({ where: { userId } });

      return toRow(await tx.user.findUniqueOrThrow({ where: { id: userId }, select: USER_SELECT }));
    }),

  // The database removes what belongs to the user with them: sessions, passkeys, collections (and their items),
  // tags. Images they uploaded stay, with no uploader (a removed user); catalogue funkos are nobody's.
  delete: (userId: number): Promise<GuardedChange<true>> =>
    guardLastAdmin(
      userId,
      () => true,
      async (tx) => {
        await tx.user.delete({ where: { id: userId }, select: { id: true } });

        return true as const;
      },
    ),
};
