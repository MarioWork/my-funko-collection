import type { Prisma } from '../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import type { UserRole } from '../auth/auth.type.ts';
import type { ListUsersQuery, UserSortField } from './users.schema.ts';

// Never the password hash itself: only whether there is one, through `hasPassword` below.
const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  temporaryPasswordExpiresAt: true,
  createdAt: true,
  passwordHash: true,
  _count: { select: { passkeys: true } },
} as const satisfies Prisma.UserSelect;

const SORT_FIELD_MAP: Record<UserSortField, 'username' | 'name' | 'createdAt'> = {
  USERNAME: 'username',
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

type SelectedUser = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

export type UserRow = Omit<SelectedUser, '_count' | 'passwordHash'> & { hasPassword: boolean; passkeyCount: number };

type NewPassword = {
  username: string;
  passwordHash: string;
  temporaryPasswordExpiresAt: Date;
};

// What a guarded change did: the user as it is now, missing (no such user), or refused because it would leave
// no admin.
export type GuardedChange<Result> = { result: Result } | { isMissing: true } | { isLastAdmin: true };

type Transaction = Prisma.TransactionClient;

type NewUser = {
  name: string;
  username: string;
  role: UserRole;
  webauthnUserId: string;
  passwordHash: string;
  temporaryPasswordExpiresAt: Date;
};

function toRow({ _count, passwordHash, ...user }: SelectedUser): UserRow {
  return { ...user, hasPassword: passwordHash !== null, passkeyCount: _count.passkeys };
}

// A user with no username (no password yet) sorts last in both directions.
function orderBy(query: ListUsersQuery): Prisma.UserOrderByWithRelationInput[] {
  const field = SORT_FIELD_MAP[query.sorting_fields];
  const direction = toOrderDirection(query.direction);
  const fieldOrder =
    field === 'username' ? { username: { sort: direction, nulls: 'last' as const } } : { [field]: direction };

  return [fieldOrder, { id: 'asc' }];
}

// Two admins demoting or deleting each other at once would both count two admins under Postgres's default
// isolation. The lock makes the second wait for the first to commit, then count again. It ends with the
// transaction (the same lock auth.repository.ts takes for first-run setup).
async function lockUsers(tx: Transaction): Promise<void> {
  await tx.$executeRaw`lock table users in share row exclusive mode`;
}

async function countAdmins(client: Transaction | typeof prisma = prisma): Promise<number> {
  return client.user.count({ where: { role: 'ADMIN' } });
}

// Runs `change` on an existing user inside one locked transaction, unless it would take away the last admin:
// that is when the user is an admin, `isLeavingAdmins` says the change ends that, and they are the only one.
async function guardLastAdmin<Result>(
  userId: number,
  isLeavingAdmins: (role: UserRole) => boolean,
  change: (tx: Transaction, role: UserRole) => Promise<Result>,
): Promise<GuardedChange<Result>> {
  return prisma.$transaction(async (tx) => {
    await lockUsers(tx);

    const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });

    if (!user) return { isMissing: true };

    const isOnlyAdmin = user.role === 'ADMIN' && (await countAdmins(tx)) === 1;

    if (isOnlyAdmin && isLeavingAdmins(user.role)) return { isLastAdmin: true };

    return { result: await change(tx, user.role) };
  });
}

export const usersRepository = {
  list: async (query: ListUsersQuery) => {
    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.user.findMany({ select: USER_SELECT, orderBy: orderBy(query), ...toSkipTake(query) }),
      prisma.user.count(),
    ]);

    return { data: rows.map(toRow), totalResultNumber };
  },

  // Usernames are stored lower-case, so the caller lower-cases what was typed. `exceptUserId` is the user the
  // username is for: their own does not count as taken.
  isUsernameTaken: async (username: string, exceptUserId?: number): Promise<boolean> => {
    const holders = await prisma.user.count({ where: { username, id: { not: exceptUserId } } });

    return holders > 0;
  },

  // The database trigger gives the new user their own "Owned" (the default) and "Wishlist". A username taken in
  // between the service's check and this insert fails the unique index, which the error handler answers as a 409.
  create: async (data: NewUser): Promise<UserRow> => toRow(await prisma.user.create({ data, select: USER_SELECT })),

  findById: async (id: number): Promise<UserRow | undefined> => {
    const row = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });

    return row ? toRow(row) : undefined;
  },

  countAdmins: (): Promise<number> => countAdmins(),

  // A new role, and every session of the user ends with it, in one go. Unchanged roles keep their sessions.
  updateRole: (userId: number, role: UserRole): Promise<GuardedChange<UserRow>> =>
    guardLastAdmin(
      userId,
      (currentRole) => currentRole === 'ADMIN' && role !== 'ADMIN',
      async (tx, currentRole) => {
        if (currentRole !== role) {
          await tx.user.update({ where: { id: userId }, data: { role }, select: { id: true } });
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
